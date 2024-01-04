import * as S from "@effect/schema/Schema";
import { Locale } from "@prisma/client";
import { pipe } from "effect/Function";

export const ModifierEnum = {
  oneOf: "oneOf",
  extras: "extras",
} as const;

export const OptionContent = S.struct({
  locale: S.enums(Locale),
  name: S.string,
  description: S.string,
});
export interface OptionContent extends S.Schema.To<typeof OptionContent> {}

export const BaseOption = S.struct({
  managementRepresentation: S.optional(S.unknown),
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: S.nonEmptyArray(OptionContent),
});
export interface BaseOption extends S.Schema.To<typeof BaseOption> {}

const OneOfOption_ = S.struct({ default: S.boolean });
export const OneOfOption = pipe(BaseOption, S.extend(OneOfOption_));
export interface OneOfOption extends S.Schema.To<typeof OneOfOption> {}

const ExtrasOption_ = S.struct({ multi: S.boolean });
export const ExtrasOption = pipe(BaseOption, S.extend(ExtrasOption_));
export interface ExtrasOption extends S.Schema.To<typeof ExtrasOption> {}

export const BaseModifier = S.struct({
  identifier: S.string,
  content: S.nonEmptyArray(OptionContent),
  options: S.nonEmptyArray(BaseOption),
});
export interface BaseModifier extends S.Schema.To<typeof BaseModifier> {}
export interface EncodedBaseModifier extends S.Schema.From<typeof BaseModifier> {}

const OneOf_ = S.struct({
  _tag: S.literal(ModifierEnum.oneOf),
  defaultOption: S.string,
  options: S.nonEmptyArray(OneOfOption),
});

export const OneOf = pipe(BaseModifier, S.omit("options"), S.extend(OneOf_));
export interface OneOf extends S.Schema.To<typeof OneOf> {}
export interface EncodedOneOf extends S.Schema.From<typeof OneOf> {}

const Extras_ = S.struct({
  _tag: S.literal(ModifierEnum.extras),
  options: S.nonEmptyArray(ExtrasOption),
  min: pipe(S.number, S.int(), S.greaterThanOrEqualTo(0), S.nullable),
  max: pipe(S.number, S.int(), S.greaterThanOrEqualTo(0), S.nullable),
});

export const Extras = pipe(BaseModifier, S.omit("options"), S.extend(Extras_));
export interface Extras extends S.Schema.To<typeof Extras> {}
export interface EncodedExtras extends S.Schema.From<typeof Extras> {}

export const ModifierConfig = S.union(OneOf, Extras);
export type ModifierConfig = OneOf | Extras;
