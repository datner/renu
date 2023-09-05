import { TaggedEnum, taggedEnum } from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";

type ManagementRepresentation = TaggedEnum<{
  Presto: { id: number };
  Unknown: {};
}>;
const ManagementRepresentation = taggedEnum<ManagementRepresentation>();

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
    id: Schema.number,
  }),
  Unknown: Schema.struct({}),
};

export const ManagementRepresentationSchema = Schema.union(
  Representation.Presto,
  pipe(Representation.Unknown, Schema.attachPropertySignature("_tag", "Unknown")),
);

export const ModifierManagementRepresentationSchema = Schema.union(
  ModifierRepresentation.Presto,
  pipe(ModifierRepresentation.Unknown, Schema.attachPropertySignature("_tag", "Unknown")),
);
