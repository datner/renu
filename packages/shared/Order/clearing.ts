import * as Schema from "@effect/schema/Schema";
import { Data, identity, String as Str } from "effect";

export type Extra = Data.TaggedEnum<{
  Gama: { phoneNumber: string };
}>;
export const Extra = Data.taggedEnum<Extra>();

class GamaExtra extends Schema.Class<GamaExtra>()({
  _tag: Schema.literal("Gama"),
  phoneNumber: Schema.string.pipe(
    Schema.compose(Schema.Trim),
    Schema.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/),
    Schema.transform(Schema.string, Str.replace("-", ""), identity),
  ),
}) {}

export const ExtraSchema = Schema.union(
  GamaExtra,
);
