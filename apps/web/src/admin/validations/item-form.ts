import { pipe } from "@effect/data/Function";
import * as RR from "@effect/data/ReadonlyRecord";
import * as Schema from "@effect/schema/Schema";
import { Category, ModifierConfig } from "shared";
import { Common, Number } from "shared/schema";

Common.Content;
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
const Content = Schema.transformResult(
  ContentStruct,
  Schema.to(ContentTuple),
  _ => Schema.parseResult(ContentTuple)(RR.collect(_, (locale, value) => ({ ...value, locale }))),
  _ => Schema.parseResult(ContentStruct)(RR.fromIterable(_, _ => [_.locale, _])),
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
export interface ExtrasSchema extends Schema.From<typeof ExtrasSchema> {}

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
export interface OneOfSchema extends Schema.From<typeof OneOfSchema> {}

export const ModifierConfigSchema = Schema.union(
  OneOfSchema,
  ExtrasSchema,
);

export const ModifierSchema = Schema.struct({
  modifierId: Schema.optional(Schema.number),
  config: ModifierConfigSchema,
});
export interface ModifierSchema extends Schema.From<typeof ModifierSchema> {}

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
export interface ItemFormSchema extends Schema.From<typeof ItemFormSchema> {}

export const CreateItemPayload = pipe(
  ItemFormSchema,
  Schema.omit("imageFile", "image"),
  Schema.extend(Schema.struct({ image: Schema.string })),
);
export interface CreateItemPayload extends Schema.From<typeof CreateItemPayload> {}

export const UpdateItemPayload = pipe(
  CreateItemPayload,
  Schema.extend(Schema.struct({ id: Schema.number })),
);
export interface UpdateItemPayload extends Schema.From<typeof UpdateItemPayload> {}
