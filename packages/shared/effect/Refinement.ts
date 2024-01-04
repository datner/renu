import { Option, Predicate } from "effect";

export const isTagged = <T extends B["_tag"] & string, A extends { _tag: string }, B extends A>(
  tag: T,
): Predicate.Refinement<A, B> =>
(a: A): a is B => a["_tag"] === tag;

export const refineTag = <T extends A["_tag"] & string, A extends { _tag: string }>(
  tag: T,
) =>
(_: A) =>
  _["_tag"] === tag
    ? Option.some(
      _ as Extract<A, {
        _tag: T;
      }>,
    )
    : Option.none();
