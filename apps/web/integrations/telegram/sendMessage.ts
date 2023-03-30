import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match, P } from "ts-pattern"
import * as Effect from "@effect/io/Effect"
import { client, ConstantCaseConfigProvider, TelegramConfig, TelegramResponseError } from "./client"
import { NoEnvVarError } from "src/core/helpers/env"
import { TelegramError, Format, Telegram } from "telegraf"
import { log } from "blitz"

const onLeft = (err: TelegramResponseError | NoEnvVarError) =>
  match(err)
    .with({ tag: "NoEnvVarError" }, ({ key }) => log.error(`Telegram: no env var ${key}`))
    .with(P.instanceOf(TelegramResponseError), ({ error }) =>
      log.error(`Telegram: ${(error as Error).message}`)
    )
    .exhaustive()

export const sendMessage = (msg: string | Format.FmtString) =>
  pipe(
    client,
    TE.fromEither,
    TE.chainW(({ telegram, chatId }) =>
      TE.tryCatch(
        () => telegram.sendMessage(chatId, msg),
        (err): TelegramResponseError => new TelegramResponseError(err as TelegramError)
      )
    ),
    TE.match(onLeft, () => log.success("Reported to Telegram successfully"))
  )

export const alertDatner = (msg: string | Format.FmtString) =>
  pipe(
    Effect.config(TelegramConfig),
    Effect.flatMap((config) =>
      Effect.attemptPromise(() => new Telegram(config.botToken).sendMessage(config.datnerId, msg))
    ),
    Effect.catchAll(() => Effect.logError("Failed to send message to Telegram")),
    Effect.withConfigProvider(ConstantCaseConfigProvider)
  )

export const notify = (msg: string | Format.FmtString) =>
  pipe(
    Effect.config(TelegramConfig),
    Effect.flatMap((config) =>
      Effect.attemptPromise(() => new Telegram(config.botToken).sendMessage(config.chatId, msg))
    ),
    Effect.catchAll(() => Effect.logError("Failed to send message to Telegram")),
    Effect.withConfigProvider(ConstantCaseConfigProvider)
  )
