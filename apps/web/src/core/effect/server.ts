import * as Effect from "@effect/io/Effect"
import * as O from "@effect/data/Option"
import * as Brand from "@effect/data/Brand"
import { pipe } from "@effect/data/Function"
import { Number } from "shared/branded"

export const paginate =
  <
    B1 extends Number.NonNegativeInt & Brand.Brand<string>,
    B2 extends Number.PositiveInt & Brand.Brand<string>
  >(
    skipBrand: Brand.Brand.Constructor<B1>,
    takeBrand: Brand.Brand.Constructor<B2>
  ) =>
  <R1, E1, R2, E2, A>(
    f: (skip: B1, take: B2) => Effect.Effect<R2, E2, Iterable<A>>,
    count: Effect.Effect<R1, E1, Number.NonNegativeInt>
  ) =>
  (skip: Brand.Brand.Unbranded<B1>, take: Brand.Brand.Unbranded<B2>) =>
    pipe(
      Effect.sync(() => [skipBrand(skip), takeBrand(take)] as const),
      Effect.flatMap(([s, t]) =>
        pipe(
          Effect.allPar(count, f(s, t)),
          Effect.map(([c, r]) => ({
            hasMore: s + t < c,
            nextPage: O.liftPredicate((_) => s + t < c)({
              take: t,
              skip: skipBrand((s + t) as Brand.Brand.Unbranded<B1>),
            }),
            pageCount: Number.PositiveInt(Math.floor((c + t - 1) / t)),
            pageSize: t,
            from: Number.PositiveInt(s + 1),
            to: Number.PositiveInt(s + t),
            count: c,
            items: r,
          }))
        )
      )
    )
