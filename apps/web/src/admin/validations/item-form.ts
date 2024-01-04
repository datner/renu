import { Schema } from "@effect/schema";
import { pipe, ReadonlyRecord as RR } from "effect";
import { Category, ModifierConfig } from "shared";
import { Common, Number } from "shared/schema";
import { Slug } from "shared/schema/common";

const Content_ = Schema.struct({
  name: Common.Name,
  description: Common.Description,
});
const ContentStruct = Schema.struct({
  en: Content_,
  he: Content_,
});
const ContentTuple = Schema.tuple(
  Schema.attachPropertySignature("locale", "en")(Content_),
  Schema.attachPropertySignature("locale", "he")(Content_),
);
const Content = Schema.transformOrFail(
  ContentStruct,
  Schema.to(ContentTuple),
  _ => Schema.parse(ContentTuple)(RR.collect(_, (locale, value) => ({ ...value, locale }))),
  _ => Schema.parse(ContentStruct)(RR.fromIterableBy(_, _ => _.locale)),
);

export const ExtrasOption = Schema.struct({
  identifier: Common.Slug,
  price: Number.Price,
  multi: Schema.boolean,
  content: Content,
  managementRepresentation: Schema.from(ModifierConfig.Base.ManagementRepresentationSchema),
});

export const ExtrasSchema = Schema.struct({
  _tag: Schema.literal("extras"),
  identifier: Common.Slug,
  content: Content,
  options: Schema.nonEmptyArray(ExtrasOption),
  min: Schema.number,
  max: Schema.number,
});
export interface ExtrasSchema extends Schema.Schema.From<typeof ExtrasSchema> {}

export const OneOfOption = Schema.struct({
  identifier: Common.Slug,
  price: Number.Price,
  content: Content,
  managementRepresentation: Schema.from(ModifierConfig.Base.ManagementRepresentationSchema),
});

export const OneOfSchema = Schema.struct({
  _tag: Schema.literal("oneOf"),
  defaultOption: Schema.string,
  identifier: Common.Slug,
  content: Content,
  options: Schema.nonEmptyArray(OneOfOption),
});
export interface OneOfSchema extends Schema.Schema.From<typeof OneOfSchema> {}

export const ModifierConfigSchema = Schema.union(
  OneOfSchema,
  ExtrasSchema,
);

export const ModifierSchema = Schema.struct({
  modifierId: Schema.optional(Schema.number),
  config: ModifierConfigSchema,
});
export interface ModifierSchema extends Schema.Schema.From<typeof ModifierSchema> {}

export const ItemFormSchema = Schema.struct({
  identifier: Common.Slug,
  categoryId: Category.Id,
  price: Number.Price,
  content: Content,
  // patches SSR limitations
  imageFile: Schema.optional(Schema.any),
  image: pipe(
    Schema.struct({
      src: Schema.string,
      blur: Schema.optional(Schema.union(Schema.string, Schema.undefined)),
    }),
    Schema.transform(Schema.string, _ => _.src, _ => ({ src: _, blur: undefined })),
  ),
  modifiers: Schema.array(ModifierSchema),
});
export interface ItemFormSchema extends Schema.Schema.From<typeof ItemFormSchema> {}

export const UpsertItemPayload = pipe(
  ItemFormSchema,
  Schema.omit("imageFile", "image"),
  Schema.extend(Schema.struct({
    newIdentifier: Schema.optional(Slug),
    image: Schema.string,
  })),
);
export interface UpsertItemPayload extends Schema.Schema.From<typeof UpsertItemPayload> {}
