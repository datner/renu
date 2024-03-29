import { Effect, Exit, Layer, pipe, Runtime, Scope } from "effect";

export const makeRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make());
    const env = yield* $(Layer.buildWithScope(layer, scope));
    const runtime = yield* $(pipe(Effect.runtime<A>(), Effect.scoped, Effect.provide(env)));

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit),
    };
  });

export const getAmbientRuntime =
  (cleanupSymbol: symbol) =>
  <E, A extends { runtime: Runtime.Runtime<any>; clean: Effect.Effect<never, never, void> }>(
    runtimeEffect: Effect.Effect<never, E, A>,
  ) => {
    const existing = process.listeners("beforeExit").find((listener) => cleanupSymbol in listener);

    if (existing) {
      process.removeListener("beforeExit", existing);
    }

    const runtime = new Promise<void>((resolve) => {
      existing?.(0);
      resolve();
    }).then(() => Effect.runPromise(runtimeEffect));

    const cleanup = Object.assign(
      () =>
        Effect.runPromise(
          pipe(
            Effect.promise(() => runtime),
            Effect.flatMap((_) => _.clean),
          ),
        ),
      { [cleanupSymbol]: true },
    );

    process.on("beforeExit", cleanup);

    return runtime;
  };
