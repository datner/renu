import { ItemModifier, Locale, ManagementProvider, Prisma } from "database"
import { Slug } from "src/auth/validations"
import { z } from "zod"
import { ensureType, Id } from "src/core/helpers/zod"
import { Extras, ModifierConfig, OneOf, OptionContent } from "db/itemModifierConfig"
import { DefaultValues } from "react-hook-form"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as A from "fp-ts/Array"
import * as N from "fp-ts/number"
import * as Ord from "fp-ts/Ord"
import { match } from "ts-pattern"
import { constant, pipe, tuple } from "fp-ts/function"
import { PromiseReturnType } from "blitz"
import getItem from "./queries/getItem"
import getVenueManagementIntegration from "src/venues/queries/current/getVenueManagementIntegration"

export const Content = z.object({
  name: z.string().min(1),
  description: z.string(),
})

const ContentSchema = z.object({
  en: Content,
  he: Content,
})

export interface ZodImage {
  file?: File | undefined
  src: string
  blur?: string
}

export const Image: z.ZodType<ZodImage> = z.object({
  file: z.any(),
  src: z.string(),
  blur: z.string().optional(),
})

const BaseModifierOptionSchema = z.object({
  identifier: Slug,
  managementId: z.string().nullable(),
  price: z.number(),
  content: ContentSchema,
})

export const OneOfOptionSchema = z.object({}).extend(BaseModifierOptionSchema.shape)

export const ExtrasOptionSchema = z
  .object({
    multi: z.boolean(),
  })
  .extend(BaseModifierOptionSchema.shape)

export type OneOfOptionSchema = z.input<typeof OneOfOptionSchema>

const BaseModifierSchema = z.object({
  identifier: Slug,
  content: ContentSchema,
})

export const OneOfSchema = z
  .object({
    _tag: z.literal("oneOf"),
    options: OneOfOptionSchema.array().nonempty(),
    defaultOption: z.string(),
  })
  .extend(BaseModifierSchema.shape)

export const ExtrasSchema = z
  .object({
    _tag: z.literal("extras"),
    options: ExtrasOptionSchema.array().nonempty(),
    min: z.number(),
    max: z.number(),
  })
  .extend(BaseModifierSchema.shape)

export type OneOfSchema = z.infer<typeof OneOfSchema>
export type OneOfSchemaInput = z.input<typeof OneOfSchema>
export type ExtrasSchema = z.infer<typeof ExtrasSchema>
export type ExtrasSchemaInput = z.input<typeof ExtrasSchema>

export const ModifierSchema = z.object({
  modifierId: z.number().optional(),
  managementId: z.string().optional(),
  config: z.discriminatedUnion("_tag", [
    OneOfSchema,
    ExtrasSchema,
  ]) /* leaving room for management integration */,
})
export type ModifierSchema = z.infer<typeof ModifierSchema>

export const ItemSchema = z
  .object({
    managementId: z.string().nullish().optional(),
    image: Image,
    price: z.number().int().nonnegative().multipleOf(50, "Price should only be multiples of 50"),
    identifier: Slug,
    categoryId: Id,
    modifiers: ModifierSchema.array(),
  })
  .extend(ContentSchema.shape)

export const toContent = (
  content: OptionContent[]
): DefaultValues<z.input<typeof ContentSchema>> => ({
  en: content.find((c) => c.locale === "en"),
  he: content.find((c) => c.locale === "he"),
})

export const toOneOfDefaults =
  (toId: (v?: Prisma.JsonValue) => null | string) =>
  ({ content, options, ...oneOf }: OneOf): DefaultValues<OneOfSchema> => ({
    ...oneOf,
    content: toContent(content),
    options: pipe(
      options,
      A.let("newContent", ({ content }) => toContent(content)),
      A.map(({ newContent, managementRepresentation, ...o }) => ({
        ...o,
        managementId: toId(managementRepresentation),
        content: newContent,
      }))
    ),
    defaultOption: pipe(
      options,
      A.findIndex((o) => o.default),
      O.map(String),
      O.getOrElse(() => "0")
    ),
  })

export const toExtrasDefaults =
  (toId: (v?: Prisma.JsonValue) => null | string) =>
  ({
    content,
    options,
    min,
    max,
    ...extras
  }: z.input<typeof Extras>): DefaultValues<ExtrasSchema> => ({
    ...extras,
    content: toContent(content),
    options: pipe(
      options,
      A.map(({ content, managementRepresentation, ...o }) => ({
        ...o,
        managementId: toId(managementRepresentation),
        content: toContent(content),
      }))
    ),
    min: min ?? 0,
    max: max ?? 0,
  })

const getDefaultValues = constant<DefaultValues<ItemSchema>>({
  identifier: "",
  price: 0,
  en: { name: "", description: "" },
  he: { name: "", description: "" },
  image: { src: "" },
  modifiers: [],
})

const byPosition = pipe(
  N.Ord,
  Ord.contramap((mod: ItemModifier) => mod.position)
)

export type GetItemResult = PromiseReturnType<typeof getItem>
export type GetManagementIntegrationResult = PromiseReturnType<typeof getVenueManagementIntegration>

const DorixManagement = z.object({ id: z.string().nullish() }).partial()

const managementThings = {
  [ManagementProvider.DORIX]: (integration?: unknown) =>
    pipe(
      integration,
      ensureType(DorixManagement),
      O.getRight,
      O.chainNullableK((i) => i.id),
      O.getOrElseW(() => null)
    ),
  [ManagementProvider.RENU]: (_?: unknown) => null,
} satisfies Record<ManagementProvider, (integration?: unknown) => null | string>

export const toDefaults = (integration: GetManagementIntegrationResult) =>
  O.match<GetItemResult, DefaultValues<ItemSchema>>(
    getDefaultValues,
    ({
      identifier,
      categoryId,
      price,
      content,
      image,
      blurDataUrl,
      modifiers,
      managementRepresentation,
    }) =>
      pipe(
        integration,
        E.matchW(
          () => () => null,
          (mi) => managementThings[mi.provider]
        ),
        (toId) => ({
          managementId: toId(managementRepresentation),
          identifier,
          categoryId,
          price,
          en: content.find((it) => it.locale === Locale.en),
          he: content.find((it) => it.locale === Locale.he),
          image: {
            src: image,
            blur: blurDataUrl ?? undefined,
          },
          modifiers: pipe(
            modifiers,
            A.sort(byPosition),
            A.map((m) => ({
              modifierId: m.id,
              config: pipe(m.config, ModifierConfig.parse, ModifierConfig.unparse, (m) =>
                match(m)
                  .with({ _tag: "oneOf" }, toOneOfDefaults(toId))
                  .with({ _tag: "extras" }, toExtrasDefaults(toId))
                  .exhaustive()
              ),
            }))
          ),
        })
      )
  )

const ItemSchemaImgTransform = ItemSchema.extend({ image: Image.transform((it) => it.src) })

export type OptionsSchemaArray = (
  | z.infer<typeof ExtrasOptionSchema>
  | z.infer<typeof OneOfOptionSchema>
)[]

export const CreateItem = ItemSchemaImgTransform.transform(
  ({ en, he, categoryId, modifiers, managementId, ...rest }) =>
    ({
      ...rest,
      managementRepresentation: { id: managementId },
      category: { connect: { id: categoryId } },
      categoryItems: {
        create: {
          position: -1,
          Category: { connect: { id: categoryId } },
        },
      },
      content: {
        createMany: {
          data: [
            { locale: Locale.en, ...en },
            { locale: Locale.he, ...he },
          ],
        },
      },

      modifiers: {
        create: pipe(
          modifiers,
          A.filter((m) => m.modifierId == null),
          A.mapWithIndex((p, { config: { content, ...c } }) => ({
            position: p,
            config: {
              ...c,
              content: [
                { locale: Locale.en, ...content.en },
                { locale: Locale.he, ...content.he },
              ],
              options: pipe(
                c.options as (
                  | z.infer<typeof ExtrasOptionSchema>
                  | z.infer<typeof OneOfOptionSchema>
                )[],
                A.mapWithIndex((i, o) => ({
                  ...o,
                  position: i,
                  content: [
                    { locale: Locale.en, ...o.content.en },
                    { locale: Locale.he, ...o.content.he },
                  ],
                })),
                A.map((o) =>
                  c._tag === "oneOf"
                    ? {
                        ...o,
                        default: c.defaultOption === o.identifier,
                      }
                    : o
                )
              ),
            },
          }))
        ),
      },
    } satisfies Prisma.ItemCreateInput)
)

export const UpdateItem = ItemSchemaImgTransform.extend({ id: Id }).transform(
  ({ en, he, ...rest }) => {
    if (!en && !he) return rest
    return {
      ...rest,
      content: {
        updateMany: [tuple(Locale.en, en), tuple(Locale.he, he)].map(([locale, data]) => ({
          where: { locale },
          data,
        })),
      },
    }
  }
)

export type UpdateItem = z.input<typeof UpdateItem>
export type CreateItem = z.input<typeof CreateItem>
export type ItemSchema = z.input<typeof ItemSchema>
