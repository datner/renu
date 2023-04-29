import * as O from "@effect/data/Option";
import * as P from "@effect/data/Predicate";

export const isTagged = <T extends B["_tag"] & string, A extends { _tag: string }, B extends A>(
  tag: T,
): P.Refinement<A, B> =>
(a: A): a is B => a["_tag"] === tag;

export const refineTag = <T extends A["_tag"] & string, A extends { _tag: string }>(
  tag: T,
) =>
(_: A) =>
  _["_tag"] === tag
    ? O.some(
      _ as Extract<A, {
        _tag: T;
      }>,
    )
    : O.none();
