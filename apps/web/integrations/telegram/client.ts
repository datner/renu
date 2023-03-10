import * as Config from "@effect/io/Config"
import * as ConfigProvider from "@effect/io/Config/Provider"
import { pipe } from "fp-ts/lib/function"
import * as E from "fp-ts/lib/Either"
import { Telegram } from "telegraf"
import { getEnvVar } from "src/core/helpers/env"

export class TelegramResponseError {
  readonly _tag = "TelegramResponseError"
  constructor(readonly error?: unknown) {}
}

export const client = pipe(
  getEnvVar("TELEGRAM_BOT_TOKEN"),
  E.map((token) => new Telegram(token)),
  E.bindTo("telegram"),
  E.bind("chatId", () => getEnvVar("TELEGRAM_CHAT_ID"))
)

export const ConstantCaseConfigProvider = pipe(
  ConfigProvider.fromEnv(),
  ConfigProvider.constantCase
)

export const TelegramConfig = Config.all({
  botToken: Config.string("telegram.bot.token"),
  chatId: Config.string("telegram.chat.id"),
})
