import * as Config from "@effect/io/Config";
import * as ConfigProvider from "@effect/io/Config/Provider";

export const ConstantCaseConfigProvider = ConfigProvider.constantCase(ConfigProvider.fromEnv());

export const TelegramConfig = Config.all({
  botToken: Config.string("TELEGRAM_BOT_TOKEN"),
  chatId: Config.string("TELEGRAM_CHAT_ID"),
  datnerId: Config.string("TELEGRAM_DATNER_CHAT_ID"),
});
