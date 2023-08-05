import { pipe } from "@effect/data/Function";
import { TaggedEnum, taggedEnum } from "@effect/match/TaggedEnum";
import * as S from "@effect/schema/Schema";
import * as Schema from "@effect/schema/Schema";
import { Common } from "../schema";

export const ManagementRepresentation = taggedEnum<{
  Presto: { id: number };
  None: {};
}>();

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

export type ManagementRepresentation = TaggedEnum.Infer<typeof ManagementRepresentation>;

export const Option = S.struct({
  managementRepresentation: ManagementRepresentationSchema,
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
