import { TaggedEnum, taggedEnum } from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import * as Schema from "@effect/schema/Schema";
import { Common } from "../schema";

export type ManagementRepresentation = TaggedEnum<{
  Presto: { id: number };
  None: {};
}>;
export const ManagementRepresentation = taggedEnum<ManagementRepresentation>();

export const Representation = {
  Presto: Schema.struct({
    _tag: Schema.literal("Presto"),
    id: Schema.number,
  }),
  None: Schema.transform(
    Schema.null,
    Schema.struct({ _tag: Schema.literal("None") }),
    () => ({ _tag: "None" }) as const,
    () => null,
  ),
};

export const ManagementRepresentationSchema = Schema.union(
  Representation.Presto,
  Representation.None,
);

export const Option = S.struct({
  managementRepresentation: ManagementRepresentationSchema,
  identifier: S.string,
  position: pipe(S.number, S.int()),
  price: S.number,
  content: Common.Content.pipe(S.omit("id"), S.nonEmptyArray),
});
export interface Option extends S.Schema.To<typeof Option> {}

export const Modifier = S.struct({
  identifier: S.string,
  content: Common.Content.pipe(S.omit("id"), S.nonEmptyArray),
  options: S.nonEmptyArray(Option),
});
export interface Modifier extends S.Schema.To<typeof Modifier> {}
