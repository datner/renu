import { pipe } from "@effect/data/Function";
import { TaggedEnum, taggedEnum } from "@effect/match/TaggedEnum";
import * as Schema from "@effect/schema/Schema";

const ManagementRepresentation = taggedEnum<{
  Presto: { id: number };
  Unknown: {};
}>();

export const Representation = {
  Presto: Schema.struct({
    _tag: Schema.literal("Presto"),
    id: Schema.number,
  }),
  Unknown: Schema.struct({}),
};

export const ModifierRepresentation = {
  Presto: Schema.struct({
    _tag: Schema.literal("Presto"),
    id: Schema.string,
  }),
  Unknown: Schema.struct({}),
}

export const ManagementRepresentationSchema = Schema.union(
  Representation.Presto,
  pipe(Representation.Unknown, Schema.attachPropertySignature("_tag", "Unknown")),
);

export const ModifierManagementRepresentationSchema = Schema.union(
  ModifierRepresentation.Presto,
  pipe(ModifierRepresentation.Unknown, Schema.attachPropertySignature("_tag", "Unknown")),
);

export type ManagementRepresentation = TaggedEnum.Infer<typeof ManagementRepresentation>;
