import { describe, assert, it, beforeEach } from "vitest"
import * as Clock from "@effect/io/Clock"
import * as Ref from "@effect/io/Ref"
import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import * as Schedule from "@effect/io/Schedule"
import { constTrue, pipe } from "@fp-ts/data/Function"
import * as E from "@fp-ts/data/Either"
import * as Duration from "@fp-ts/data/Duration"
import { CircuitBreaker as C, Common } from "."

type Context = {
  layer: (
    state: Ref.Ref<C.BreakerState>
  ) => Layer.Layer<
    never,
    never,
    Common.IdentityService | C.BreakerConfigService | C.BreakerStateService | Common.ScheduleService
  >
}

describe("circuitBreaker", () => {
  beforeEach<Context>(async (ctx) => {
    ctx.layer = (state: Ref.Ref<C.BreakerState>) =>
      pipe(
        Layer.succeed(Common.IdentityService)({ name: "test" }),
        Layer.merge(
          Layer.succeed(C.BreakerConfigService)({
            maxFailure: 1,
            cooldown: Duration.millis(5),
          })
        ),
        Layer.merge(
          Layer.succeed(C.BreakerStateService)({
            state,
          })
        ),
        Layer.merge(
          Layer.succeed(Common.ScheduleService)({
            retry: Schedule.spaced(Duration.zero),
          })
        )
      )
  })

  it<Context>("should allow request when closed", async (ctx) => {
    const test = Effect.gen(function* ($) {
      const state = yield* $(Ref.make(C.closed(0)))
      const result = yield* $(
        pipe(
          Effect.succeed("success"),
          C.breaker(constTrue),
          Effect.provideLayer(ctx.layer(state)),
          Effect.either
        )
      )

      assert.deepStrictEqual(result, E.right("success"))
    })

    await Effect.unsafeRunPromise(test)
  })

  it<Context>("should instant fail when open", async (ctx) => {
    const test = Effect.gen(function* ($) {
      const state = yield* $(Ref.make(C.open(Duration.days(1))))
      const result = yield* $(
        pipe(
          Effect.succeed("success"),
          C.breaker(constTrue),
          Effect.provideLayer(ctx.layer(state)),
          Effect.catchTag("BreakerError", () => Effect.fail("fail")),
          Effect.either
        )
      )
      assert.deepStrictEqual(result, E.left("fail"))
    })

    await Effect.unsafeRunPromise(test)
  })

  it<Context>("should flip to open after max failures and return the last error", async (ctx) => {
    const test = Effect.gen(function* ($) {
      const state = yield* $(Ref.make(C.closed(1)))
      const result = yield* $(
        pipe(
          Effect.fail({ _tag: "fail", error: "test" } as const),
          C.breaker(constTrue),
          Effect.provideLayer(ctx.layer(state)),
          Effect.catchTag("fail", () => Effect.fail("fail")),
          Effect.either
        )
      )

      assert.deepStrictEqual(result, E.left("fail"))
    })

    await Effect.unsafeRunPromise(test)
  })

  it<Context>("should flip to closed after a half-open success", async (ctx) => {
    const test = pipe(
      Effect.gen(function* ($) {
        const state = yield* $(Ref.make(C.open(Duration.millis(5))))
        const roundA = yield* $(
          pipe(
            Effect.succeed("success"),
            C.breaker(constTrue),
            Effect.provideLayer(ctx.layer(state)),
            Effect.catchTag("BreakerError", () => Effect.fail("fail")),
            Effect.either
          )
        )
        assert.deepStrictEqual(roundA, E.left("fail"))

        yield* $(Clock.sleep(Duration.millis(5)))

        const roundB = yield* $(
          pipe(
            Effect.succeed("success"),
            C.breaker(constTrue),
            Effect.provideLayer(ctx.layer(state)),
            Effect.either
          )
        )
        assert.deepStrictEqual(roundB, E.right("success"))

        const roundC = yield* $(
          pipe(
            Effect.fail({ _tag: "fail", error: "test" } as const),
            C.breaker(constTrue),
            Effect.provideLayer(ctx.layer(state)),
            Effect.catchTag("fail", () => Effect.fail("fail")),
            Effect.either
          )
        )
        assert.deepStrictEqual(roundC, E.left("fail"))
      })
    )
    await Effect.unsafeRunPromise(test)
  })

  it<Context>("should refresh opened after a half-open failure", async (ctx) => {
    const test = pipe(
      Effect.gen(function* ($) {
        const state = yield* $(Ref.make(C.open(Duration.millis(5))))
        const roundA = yield* $(
          pipe(
            Effect.succeed("success"),
            C.breaker(constTrue),
            Effect.provideLayer(ctx.layer(state)),
            Effect.catchTag("BreakerError", () => Effect.fail("open")),
            Effect.either
          )
        )
        assert.deepStrictEqual(roundA, E.left("open"))

        yield* $(Clock.sleep(Duration.millis(5)))

        const roundB = yield* $(
          pipe(
            Effect.fail({ _tag: "fail", error: "error" } as const),
            C.breaker(constTrue),
            Effect.provideLayer(ctx.layer(state)),
            Effect.catchTag("fail", () => Effect.fail("fail")),
            Effect.either
          )
        )
        assert.deepStrictEqual(roundB, E.left("fail"))

        const roundC = yield* $(
          pipe(
            Effect.succeed("success"),
            C.breaker(constTrue),
            Effect.provideLayer(ctx.layer(state)),
            Effect.catchTag("BreakerError", () => Effect.fail("breaker")),
            Effect.either
          )
        )
        assert.deepStrictEqual(roundC, E.left("breaker"))
      })
    )
    await Effect.unsafeRunPromise(test)
  })
})
