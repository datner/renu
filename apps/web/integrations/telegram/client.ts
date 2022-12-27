import { pipe } from "fp-ts/lib/function"
import * as E from "fp-ts/lib/Either"
import { Telegram, TelegramError } from "telegraf"
import { getEnvVar } from "src/core/helpers/env"

export type TelegramResponseError = {
  tag: "telegramError"
  error: TelegramError
}

export const client = pipe(
  getEnvVar("TELEGRAM_BOT_TOKEN"),
  E.map((token) => new Telegram(token)),
  E.bindTo("telegram"),
  E.bind("chatId", () => getEnvVar("TELEGRAM_CHAT_ID"))
)
