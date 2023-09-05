import { TaggedEnum, taggedEnum } from "@effect/data/Data";
import { identity, pipe } from "@effect/data/Function";
import * as Str from "@effect/data/String";
import * as Schema from "@effect/schema/Schema";

export type Extra = TaggedEnum<{
  Presto: { phoneNumber: string };
}>;
export const Extra = taggedEnum<Extra>();

const PrestoExtraSchema = Schema.data(Schema.struct({
  _tag: Schema.literal("Presto"),
  phoneNumber: pipe(
    Schema.string,
    Schema.trim,
    Schema.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    Schema.transform(Schema.string, Str.replace("-", ""), identity),
  ),
}));

export const ExtraSchema = Schema.union(
  PrestoExtraSchema,
);
