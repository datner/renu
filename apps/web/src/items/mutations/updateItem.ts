import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"
import * as A from "fp-ts/Array"
import { pipe, tuple } from "fp-ts/function"
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import { getBlurDataUrl } from "src/core/helpers/plaiceholder"
import { ModifierSchema, OptionsSchemaArray, UpdateItem } from "../validations"
import { NotFoundError } from "blitz"
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "src/core/helpers/revalidation"

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  setDefaultOrganizationId,
  setDefaultVenue,
  enforceSuperAdminIfNotCurrentOrganization,
  async (input) => {
    const item = await db.item.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
      select: { image: true, blurDataUrl: true },
    })
    if (!item) throw new NotFoundError()

    if (item.image === input.image) return input

    return { ...input, blurDataUrl: await getBlurDataUrl(input.image) }
  },
  async ({ organizationId, venue, id, modifiers, managementId, ...data }) => {
    // without declartion typescript reaches it's inferrence limits later on. Yikes.
    const modifiersWithPosition: [number, ModifierSchema][] = pipe(modifiers, A.mapWithIndex(tuple))
    const item = await db.item.update({
      where: { id },
      include: { content: true, modifiers: true },
      data: {
        ...data,
        managementRepresentation: { id: managementId },
        modifiers: {
          update: pipe(
            modifiersWithPosition,
            A.filter(([, m]) => m.modifierId != null),
            A.map(([p, { config, modifierId, managementId }]) => ({
              where: { id: modifierId! },
              data: {
                managementRepresentation: { id: managementId },
                position: p,
                config: {
                  ...config,
                  content: [
                    { locale: "en", ...config.content.en },
                    { locale: "he", ...config.content.he },
                  ],
                  options: pipe(
                    config.options as OptionsSchemaArray,
                    A.mapWithIndex((i, { managementId, ...o }) => ({
                      ...o,
                      managementRepresentation: { id: managementId },
                      position: i,
                      content: [
                        { locale: "en", ...o.content.en },
                        { locale: "he", ...o.content.he },
                      ],
                    })),
                    A.mapWithIndex((i, o) =>
                      config._tag === "oneOf"
                        ? {
                            ...o,
                            default: config.defaultOption === String(i),
                          }
                        : o
                    )
                  ),
                },
              },
            }))
          ),
          create: pipe(
            modifiersWithPosition,
            A.filter(([, m]) => m.modifierId == null),
            A.map(
              ([p, m]) =>
                ({
                  position: p,
                  managementRepresentation: { id: m.managementId },
                  config: {
                    ...m.config,
                    content: [
                      { locale: "en", ...m.config.content.en },
                      { locale: "he", ...m.config.content.he },
                    ],
                    options: pipe(
                      m.config.options as OptionsSchemaArray,
                      A.mapWithIndex((i, o) => ({
                        ...o,
                        position: i,
                        content: [
                          { locale: "en", ...o.content.en },
                          { locale: "he", ...o.content.he },
                        ],
                      })),
                      A.map((o) =>
                        m.config._tag === "oneOf"
                          ? {
                              ...o,
                              default: m.config.defaultOption === o.identifier,
                            }
                          : o
                      )
                    ),
                  },
                } satisfies Prisma.ItemModifierCreateWithoutItemInput)
            )
          ),
        } satisfies Prisma.ItemModifierUncheckedUpdateManyWithoutItemNestedInput,
      },
    })
    await revalidateVenue(venue.identifier)()
    return item
  }
)
