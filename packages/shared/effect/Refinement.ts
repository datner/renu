import * as P from "@effect/data/Predicate";

export const isTagged = <T extends B["_tag"] & string, A extends { _tag: string }, B extends A>(
  tag: T,
): P.Refinement<A, B> =>
(a: A): a is B => a["_tag"] === tag;
