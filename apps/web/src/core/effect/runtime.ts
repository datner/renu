import * as ConfigProvider from "@effect/io/Config/Provider"
import * as Scope from "@effect/io/Scope"
import * as Exit from "@effect/io/Exit"
import * as Runtime from "@effect/io/Runtime"
import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import * as Logger from "@effect/io/Logger"
import { pipe } from "@fp-ts/core/Function"
import * as Management from "@integrations/management"
import * as Clearing from "@integrations/clearing"
import { Http } from "@integrations/core"

const provider = ConfigProvider.constantCase(ConfigProvider.fromEnv())

const appLayer = pipe(
  Logger.logFmt,
  Layer.merge(Effect.setConfigProvider(provider)),
  Layer.merge(Http.layer),
  Layer.provideMerge(Management.layer),
  Layer.provideMerge(Clearing.layer)
)

export const makeRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function* ($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(Layer.buildWithScope(layer, scope))
    const runtime = yield* $(pipe(Effect.runtime<A>(), Effect.scoped, Effect.provideContext(env)))

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit()),
    }
  })

export const basicRuntime = Runtime.runSync(Runtime.defaultRuntime)(makeRuntime(appLayer))

export const runPromise$ = Runtime.runPromise(basicRuntime.runtime)
export const runPromiseEither$ = Runtime.runPromiseEither(basicRuntime.runtime)
