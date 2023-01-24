import * as Scope from "@effect/io/Scope"
import * as Exit from "@effect/io/Exit"
import * as ZR from "@effect/io/Runtime"
import * as ZL from "@effect/io/Layer"
import * as Z from "@effect/io/Effect"
import { pipe } from "@fp-ts/data/Function"

export const makeRuntime = <R, E, A>(layer: ZL.Layer<R, E, A>) =>
  Z.gen(function* ($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(ZL.buildWithScope(scope)(layer))
    const runtime = yield* $(pipe(Z.runtime<A>(), Z.provideContext(env)))
    yield* $(Z.log("creating scope"))

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit()),
    }
  })

export const getAmbientRuntime =
  (cleanupSymbol: symbol) =>
  <E, A extends { runtime: ZR.Runtime<any>; clean: Z.Effect<never, never, void> }>(
    runtimeEffect: Z.Effect<never, E, A>
  ) => {
    const existing = process.listeners("beforeExit").find((listener) => cleanupSymbol in listener)

    if (existing) {
      process.removeListener("beforeExit", existing)
    }

    const runtime = new Promise<void>((resolve) => {
      existing?.(0)
      resolve()
    }).then(() => Z.unsafeRunPromise(runtimeEffect))

    const cleanup = Object.assign(
      () =>
        Z.unsafeRunPromise(
          pipe(
            Z.promise(() => runtime),
            Z.flatMap((_) => _.clean)
          )
        ),
      { [cleanupSymbol]: true }
    )

    process.on("beforeExit", cleanup)

    return runtime
  }
