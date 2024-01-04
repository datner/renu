import { Clock, Duration, Effect, Either, Function, pipe, Ref, Schedule } from "effect";
import { assert, beforeEach, describe, it } from "vitest";
import { CircuitBreaker as C } from ".";

type Context = {
  breaker: Effect.Effect<never, never, C.CircuitBreaker>;

  state: Ref.Ref<C.BreakerState>;
};

describe("circuitBreaker", () => {
  beforeEach<Context>(async (ctx) => {
    ctx.state = Ref.unsafeMake(C.closed(0));
    ctx.breaker = C.makeBreaker({
      name: "test",
      maxFailure: 1,
      cooldown: Duration.millis(5),
      retry: Schedule.spaced(Duration.zero),
      state: ctx.state,
    });
  });

  it<Context>("should allow request when closed", async (ctx) => {
    const test = Effect.gen(function*($) {
      const breaker = yield* $(ctx.breaker);
      const result = yield* $(pipe(Effect.succeed("success"), breaker(Function.constTrue), Effect.either));

      assert.deepStrictEqual(result, Either.right("success") as typeof result);
    });

    await Effect.runPromise(test);
  });

  it<Context>("should instant fail when open", async (ctx) => {
    const test = Effect.gen(function*($) {
      yield* $(Ref.set(ctx.state, C.open(Duration.days(1))));
      const breaker = yield* $(ctx.breaker);
      const result = yield* $(
        pipe(
          Effect.succeed("success"),
          breaker(Function.constTrue),
          Effect.catchTag("CircuitBreakerError", () => Effect.fail("fail")),
          Effect.either,
        ),
      );
      assert.deepStrictEqual(result, Either.left("fail") as typeof result);
    });

    await Effect.runPromise(test);
  });

  it<Context>("should flip to open after max failures and return the last error", async (ctx) => {
    const test = Effect.gen(function*($) {
      yield* $(Ref.set(ctx.state, C.closed(1)));
      const breaker = yield* $(ctx.breaker);
      const result = yield* $(pipe(Effect.fail("fail"), breaker(Function.constTrue), Effect.either));

      assert.deepStrictEqual(result, Either.left("fail") as typeof result);
    });

    await Effect.runPromise(test);
  });

  it<Context>("should flip to closed after a half-open success", async (ctx) => {
    const test = pipe(
      Effect.gen(function*($) {
        yield* $(Ref.set(ctx.state, C.open(Duration.millis(5))));
        const breaker = yield* $(ctx.breaker);
        const roundA = yield* $(
          pipe(
            Effect.succeed("success"),
            breaker(Function.constTrue),
            Effect.catchTag("CircuitBreakerError", () => Effect.fail("fail")),
            Effect.either,
          ),
        );
        assert.deepStrictEqual(roundA, Either.left("fail") as typeof roundA);

        yield* $(Clock.sleep(Duration.millis(5)));

        const roundB = yield* $(pipe(Effect.succeed("success"), breaker(Function.constTrue), Effect.either));
        assert.deepStrictEqual(roundB, Either.right("success") as typeof roundB);

        const roundC = yield* $(pipe(Effect.fail("fail"), breaker(Function.constTrue), Effect.either));
        assert.deepStrictEqual(roundC, Either.left("fail") as typeof roundC);
      }),
    );
    await Effect.runPromise(test);
  });

  it<Context>(
    "should refresh opened after a half-open failure",
    async (ctx) => {
      const test = pipe(
        Effect.gen(function*($) {
          yield* $(Ref.set(ctx.state, C.open(Duration.millis(5))));
          const breaker = yield* $(ctx.breaker);
          const roundA = yield* $(
            pipe(
              Effect.succeed("success"),
              breaker(Function.constTrue),
              Effect.catchTag("CircuitBreakerError", () => Effect.fail("open")),
              Effect.either,
            ),
          );
          assert.deepStrictEqual(roundA, Either.left("open") as typeof roundA);

          yield* $(Effect.sleep(Duration.millis(5)));

          const roundB = yield* $(pipe(Effect.fail("fail"), breaker(Function.constTrue), Effect.either));
          assert.deepStrictEqual(roundB, Either.left("fail") as typeof roundB);

          const roundC = yield* $(
            pipe(
              Effect.succeed("success"),
              breaker(Function.constTrue),
              Effect.catchTag("CircuitBreakerError", () => Effect.fail("breaker")),
              Effect.either,
            ),
          );
          assert.deepStrictEqual(roundC, Either.left("breaker") as typeof roundC);
        }),
      );
      await Effect.runPromise(test);
    },
    { retry: 4 },
  );
});
