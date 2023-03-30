import * as S from "@effect/schema/Schema";
import { pipe } from "@effect/data/Function";
import { Common } from "../schema";

export const Option = S.struct({
  managementRepresentation: S.optional(S.unknown),
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: S.nonEmptyArray(Common.Content),
});
export interface Option extends S.To<typeof Option> {}

export const Modifier = S.struct({
  identifier: S.string,
  content: S.nonEmptyArray(Common.Content),
  options: S.nonEmptyArray(Option),
});
export interface Modifier extends S.To<typeof Modifier> {}
