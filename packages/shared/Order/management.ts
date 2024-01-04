import * as Str from "@effect/data/String";
import * as Schema from "@effect/schema/Schema";
import { Data, identity, pipe } from "effect";

export type Extra = Data.TaggedEnum<{
  Presto: { phoneNumber: string };
}>;
export const Extra = Data.taggedEnum<Extra>();

class PrestoExtra extends Schema.Class<PrestoExtra>()({
  _tag: Schema.literal("Presto"),
  phoneNumber: pipe(
    Schema.string,
    Schema.compose(Schema.Trim),
    Schema.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    Schema.transform(Schema.string, Str.replace("-", ""), identity),
  ),
}) {}

export const ExtraSchema = Schema.union(
  PrestoExtra,
);
