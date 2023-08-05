/* eslint-disable react-hooks/rules-of-hooks */
import { pipe } from "@effect/data/Function";
import * as ConfigProvider from "@effect/io/Config/Provider";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Layer from "@effect/io/Layer";
import * as Logger from "@effect/io/Logger";
import * as Runtime from "@effect/io/Runtime";
import * as Scope from "@effect/io/Scope";
import { Http } from "@integrations/core";
import * as Gama from "@integrations/gama";
import * as Management from "@integrations/management";
import * as Payplus from "@integrations/payplus";
import * as Presto from "@integrations/presto";
import * as Db from "db";
import * as Telegram from "integrations/telegram";

const provider = ConfigProvider.constantCase(ConfigProvider.fromEnv());

const serverLayer = pipe(
  Logger.logFmt,
  Layer.merge(Telegram.layer),
  Layer.merge(Management.layer),
  Layer.merge(Gama.layer),
  Layer.merge(Presto.layer),
  Layer.merge(Payplus.layer),
  Layer.merge(Effect.setConfigProvider(provider)),
  Layer.useMerge(Db.layer),
  Layer.useMerge(Http.layer),
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
      clean: Scope.close(scope, Exit.unit),
    };
  });

export const basicRuntime = Runtime.runSync(Runtime.defaultRuntime)(
  makeRuntime(serverLayer),
);

export const runPromise$ = Runtime.runPromise(basicRuntime.runtime);
export const runSync$ = Runtime.runSync(basicRuntime.runtime);
export const runPromiseEither$ = Runtime.runPromise(basicRuntime.runtime);
