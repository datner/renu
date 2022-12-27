import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { client, TelegramResponseError } from "./client"
import { NoEnvVarError } from "src/core/helpers/env"
import { TelegramError, Format } from "telegraf"
import { log } from "blitz"

const onLeft = (err: TelegramResponseError | NoEnvVarError) =>
  match(err)
    .with({ tag: "NoEnvVarError" }, ({ key }) => log.error(`Telegram: no env var ${key}`))
    .with({ tag: "telegramError" }, ({ error }) => log.error(`Telegram: ${error.message}`))
    .exhaustive()

export const sendMessage = (msg: string | Format.FmtString) =>
  pipe(
    client,
    TE.fromEither,
    TE.chainW(({ telegram, chatId }) =>
      TE.tryCatch(
        () => telegram.sendMessage(chatId, msg),
        (err): TelegramResponseError => ({ tag: "telegramError", error: err as TelegramError })
      )
    ),
    TE.match(onLeft, () => log.success("Reported to Telegram successfully"))
  )
