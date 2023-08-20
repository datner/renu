import * as Option from "@effect/data/Option";
import * as Config from "@effect/io/Config";
import * as Effect from "@effect/io/Effect";
import * as FiberRef from "@effect/io/FiberRef";
import * as FiberRefs from "@effect/io/FiberRefs";
import * as Logger from "@effect/io/Logger";
import * as tslog from "tslog";

export const loggerInstance = FiberRef.unsafeMake<tslog.Logger<tslog.ILogObj>>(new tslog.Logger());

export const named = (name: string) =>
  Effect.flatMap(
    Effect.currentSpan,
    span =>
      Effect.locallyScopedWith(
        loggerInstance,
        _ => _.getSubLogger({ prefix: Option.toArray(span), name }),
      ),
  );

export const tsLogger = Logger.make<unknown, void>((options) => {
  const { logLevel, message } = options;
  const logger = FiberRefs.getOrDefault(options.context, loggerInstance);
  logger.log(logLevel.syslog, logLevel.label, message);
});

export const withLogger = (logger: tslog.Logger<tslog.ILogObj>) =>
  Effect.as(FiberRef.set(loggerInstance, logger), tsLogger);

export const makeLogger = (settings: Config.Config.Wrap<tslog.ISettings<tslog.ILogObj>>) =>
  Config.unwrap(settings).pipe(
    Effect.config,
    Effect.map(_ => new tslog.Logger(_)),
    Effect.flatMap(withLogger),
  );

export const TSLogger = Logger.replace(Logger.defaultLogger, tsLogger);
