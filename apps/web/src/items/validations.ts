import { pipe } from "@effect/data/Function";
import * as RA from "@effect/data/ReadonlyArray";
import * as Parser from "@effect/schema/Parser";
import * as S from "@effect/schema/Schema";
import { PromiseReturnType } from "blitz";
import { Locale, Prisma } from "database";
import { Modifiers } from "database-helpers";
import { Order } from "shared";
import getVenueManagementIntegration from "src/venues/queries/current/getVenueManagementIntegration";
import getItem from "./queries/getItem";

export type GetItemResult = PromiseReturnType<typeof getItem>;
export type GetManagementIntegrationResult = PromiseReturnType<typeof getVenueManagementIntegration>;

export const Id_ = pipe(
  S.union(S.NumberFromString, S.number),
  S.int(),
  S.nonNegative(),
  S.brand("Id"),
);

const Slug_ = pipe(
  S.string,
  S.nonEmpty(),
  S.pattern(/^[a-z0-9-]+$/, {
    message: (slug) => `${slug} is invalid. Slug should contain only lowercase letters, numbers, and dashes`,
  }),
  S.pattern(/[^-]$/, {
    message: (slug) => `${slug} can not end with a dash, did you mean ${slug.slice(0, -1)}?`,
  }),
  S.brand("Slug"),
);

const Price = pipe(
  S.number,
  S.int(),
  S.nonNegative(),
  S.filter((n) => n % 50 === 0),
  S.brand("Price"),
);

export const Content_ = S.struct({
  name: pipe(S.string, S.nonEmpty()),
  description: S.string,
});

export const Modifier = S.struct({
  modifierId: S.optional(Id_),
  managementId: S.optional(Id_),
  config: Modifiers.ModifierConfig,
});

export const CreateItemSchema = S.struct({
  managementId: S.optional(S.nullable(S.string)),
  image: S.string,
  price: Price,
  identifier: Slug_,
  categoryId: Id_,
  modifiers: S.array(Modifier),
  content: S.struct({
    en: Content_,
    he: Content_,
  }),
});
export interface CreateItemSchema extends S.Schema.To<typeof CreateItemSchema> {}

export const UpdateItemSchema = pipe(
  CreateItemSchema,
  S.extend(S.struct({ id: Order.Item.Id })),
);
export interface UpdateItemSchema extends S.Schema.To<typeof UpdateItemSchema> {}

export const toCreateItem = ({
  content: { en, he },
  categoryId,
  modifiers,
  managementId,
  ...rest
}: CreateItemSchema) => ({
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
        { ...en, locale: Locale.en },
        { ...he, locale: Locale.he },
      ],
    },
  },

  modifiers: {
    create: pipe(
      modifiers,
      RA.filter((m) => m.modifierId == null),
      RA.map(({ config }, p) => ({
        position: p,
        config: Parser.encodeSync(Modifiers.ModifierConfig)(config) as Prisma.InputJsonValue,
      })),
    ),
  },
} satisfies Prisma.ItemCreateInput);
