import * as Effect from "@effect/io/Effect";
import { log } from "blitz";
import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { NoEnvVarError } from "src/core/helpers/env";
import { Format, Telegram, TelegramError } from "telegraf";
import { match, P } from "ts-pattern";
import { TelegramService } from ".";
import { client, ConstantCaseConfigProvider, TelegramConfig, TelegramResponseError } from "./client";

const onLeft = (err: TelegramResponseError | NoEnvVarError) =>
  match(err)
    .with({ tag: "NoEnvVarError" }, ({ key }) => log.error(`Telegram: no env var ${key}`))
    .with(P.instanceOf(TelegramResponseError), ({ error }) => log.error(`Telegram: ${(error as Error).message}`))
    .exhaustive();

export const sendMessage = (msg: string | Format.FmtString) =>
  pipe(
    client,
    TE.fromEither,
    TE.chainW(({ telegram, chatId }) =>
      TE.tryCatch(
        () => telegram.sendMessage(chatId, msg),
        (err): TelegramResponseError => new TelegramResponseError(err as TelegramError),
      )
    ),
    TE.match(onLeft, () => log.success("Reported to Telegram successfully")),
  );

export const alertDatner = (msg: string | Format.FmtString) =>
  pipe(
    Effect.config(TelegramConfig),
    Effect.flatMap((config) =>
      Effect.tryPromise(() => new Telegram(config.botToken).sendMessage(config.datnerId, msg))
    ),
    Effect.catchAllCause((cause) => Effect.logError("Failed to send message to Telegram", cause)),
    Effect.withConfigProvider(ConstantCaseConfigProvider),
  );

export const sendJson = (json: unknown) =>
  pipe(
    Effect.flatMap(TelegramService, t =>
      Effect.promise(() =>
        t.bot.sendMessage(t.config.chatId, Format.pre("json")(JSON.stringify(json, undefined, 2)))
      )),
    Effect.catchAllCause((cause) => Effect.logError("Failed to send message to Telegram", cause)),
  );

export const notify = (msg: string | Format.FmtString) =>
  pipe(
    Effect.config(TelegramConfig),
    Effect.flatMap((config) => Effect.tryPromise(() => new Telegram(config.botToken).sendMessage(config.chatId, msg))),
    Effect.catchAllCause((cause) => Effect.logError("Failed to send message to Telegram", cause)),
    Effect.withConfigProvider(ConstantCaseConfigProvider),
  );
