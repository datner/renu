import { Cause, ConfigProvider, Effect, Exit, Layer, Logger, pipe, ReadonlyArray, Runtime, Scope } from "effect";
/* eslint-disable react-hooks/rules-of-hooks */
import { Http } from "@integrations/core";
import * as Gama from "@integrations/gama";
import * as Management from "@integrations/management";
import * as Payplus from "@integrations/payplus";
import * as Presto from "@integrations/presto";
import * as Db from "db";
import * as Telegram from "integrations/telegram";
import { Order, Venue } from "shared";
import { logger } from "src/blitz-server";
import { inspect } from "util";

const provider = ConfigProvider.constantCase(ConfigProvider.fromEnv());

const simpleLogger = Logger.mapInput(
  Logger.make(m => {
    logger.log(
      m.logLevel.syslog,
      m.logLevel.label,
      m.date,
      typeof m.message === "string" ? m.message : inspect(m.message, false, 11, true),
      Cause.isEmpty(m.cause) ? "" : Cause.pretty(m.cause),
      inspect(ReadonlyArray.fromIterable(m.annotations), false, 5, true),
      inspect(ReadonlyArray.fromIterable(m.spans), false, 5, true),
    );
    return m;
  }),
  _ => {
    if (typeof _ === "object" && _ != null && "authorization" in _) {
      const { authorization, ...rest } = _;
      return { authorization: "Bearer [redacted]", ...rest };
    }
    return _;
  },
);
const serverLayer = pipe(
  // Logger.replace(Logger.defaultLoggersimpleLogger),
  Telegram.layer,
  Layer.merge(Management.layer),
  Layer.merge(Gama.layer),
  Layer.merge(Presto.layer),
  Layer.merge(Payplus.layer),
  Layer.merge(Venue.service.layer),
  Layer.merge(Order.service.layer),
  Layer.merge(Layer.setConfigProvider(provider)),
  Layer.provideMerge(Db.layer),
  Layer.provideMerge(Http.layer),
);

export const makeRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function*($) {
    const scope = yield* $(Scope.make());
    const runtime = yield* $(Layer.toRuntime(layer), Effect.provideService(Scope.Scope, scope));

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit),
    };
  });

export const basicRuntime = Effect.runSync(
  makeRuntime(serverLayer),
);

export const runPromise$ = Runtime.runPromise(basicRuntime.runtime);
export const runSync$ = Runtime.runSync(basicRuntime.runtime);
export const runPromiseEither$ = Runtime.runPromise(basicRuntime.runtime);
