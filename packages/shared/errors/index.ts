import * as Predicate from "@fp-ts/data/Predicate"

export const taggedError =
  <T extends string>(_tag: T) =>
  (error: unknown): TaggedError<T> => ({
    _tag,
    error,
  })

export type InferError<E extends ReturnType<typeof taggedError>> = ReturnType<E>

export type TaggedError<T extends string = string> = {
  _tag: T
  error: unknown
}

export const isTaggedErrorFromUnknown =
  <Tag extends string>(tag: Tag): Predicate.Refinement<unknown, TaggedError<Tag>> =>
  (err): err is TaggedError<Tag> =>
    err != null && typeof err === "object" && "_tag" in err && "error" in err && err._tag === tag

export const isTaggedError =
  <Tag extends string>(tag: Tag): Predicate.Refinement<TaggedError, TaggedError<Tag>> =>
  (err): err is TaggedError<Tag> =>
    err != null && typeof err === "object" && "_tag" in err && "error" in err && err._tag === tag
