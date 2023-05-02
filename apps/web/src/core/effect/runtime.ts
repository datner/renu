import * as ConfigProvider from "@effect/io/Config/Provider";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Layer from "@effect/io/Layer";
import * as Logger from "@effect/io/Logger";
import * as Runtime from "@effect/io/Runtime";
import * as Scope from "@effect/io/Scope";
import { pipe } from "@fp-ts/core/Function";
import * as Clearing from "@integrations/clearing";
import { Http } from "@integrations/core";
import * as Gama from "@integrations/gama";
import * as Management from "@integrations/management";
import * as Presto from "@integrations/presto";
import * as Db from "db";
import * as Telegram from "integrations/telegram";

const provider = ConfigProvider.constantCase(ConfigProvider.fromEnv());

const serverLayer = pipe(
  Logger.logFmt,
  Layer.merge(Effect.setConfigProvider(provider)),
  Layer.merge(Http.layer),
  Layer.merge(Db.layer),
  Layer.merge(Telegram.layer),
  Layer.provideMerge(Management.layer),
  Layer.provideMerge(Clearing.layer),
  Layer.provideMerge(Gama.layer),
  Layer.provideMerge(Presto.layer),
);

export const makeRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make());
    const env = yield* $(Layer.buildWithScope(layer, scope));
    const runtime = yield* $(
      pipe(Effect.runtime<A>(), Effect.scoped, Effect.provideContext(env)),
    );

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit()),
    };
  });

export const basicRuntime = Runtime.runSync(Runtime.defaultRuntime)(
  makeRuntime(serverLayer),
);

export const runPromise$ = Runtime.runPromise(basicRuntime.runtime);
export const runSync$ = Runtime.runSync(basicRuntime.runtime);
export const runPromiseEither$ = Runtime.runPromiseEither(basicRuntime.runtime);
