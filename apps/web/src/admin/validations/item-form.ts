import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import { Category, ModifierConfig } from "shared";
import { Common, Number } from "shared/schema";

const Content_ = Schema.struct({ name: Schema.string, description: Schema.string });
const Content = Schema.struct({
  en: Content_,
  he: Content_,
});

export const ExtrasOption = Schema.struct({
  identifier: Common.Slug,
  price: Number.Price,
  multi: Schema.boolean,
  content: Content,
  managementRepresentation: Schema.optional(ModifierConfig.Base.ManagementRepresentationSchema),
});

export const ExtrasSchema = Schema.struct({
  _tag: Schema.literal("extras"),
  identifier: Common.Slug,
  content: Content,
  options: Schema.nonEmptyArray(ExtrasOption),
  min: Schema.number,
  max: Schema.number,
});
export interface ExtrasSchema extends Schema.From<typeof ExtrasSchema> { }

export const OneOfOption = Schema.struct({
  identifier: Common.Slug,
  price: Number.Price,
  content: Content,
  managementRepresentation: Schema.optional(ModifierConfig.Base.ManagementRepresentationSchema),
});

export const OneOfSchema = Schema.struct({
  _tag: Schema.literal("oneOf"),
  defaultOption: Schema.string,
  identifier: Common.Slug,
  content: Content,
  options: Schema.nonEmptyArray(OneOfOption),
});
export interface OneOfSchema extends Schema.From<typeof OneOfSchema> { }

export const ModifierSchema = Schema.struct({
  modifierId: Schema.optional(Schema.number),
  config: Schema.union(
    OneOfSchema,
    ExtrasSchema,
  ),
});
export interface ModifierSchema extends Schema.From<typeof ModifierSchema> { }

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
export interface ItemFormSchema extends Schema.From<typeof ItemFormSchema> { }

export const CreateItemPayload = pipe(
  Schema.to(ItemFormSchema),
  Schema.omit("imageFile"),
);
export interface CreateItemPayload extends Schema.From<typeof CreateItemPayload> { }

export const UpdateItemPayload = pipe(
  CreateItemPayload,
  Schema.extend(Schema.struct({ id: Schema.number })),
);
export interface UpdateItemPayload extends Schema.From<typeof UpdateItemPayload> { }
