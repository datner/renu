import { Effect } from "effect";
import { Format, Telegram } from "telegraf";
import { TelegramService } from ".";
import { ConstantCaseConfigProvider, TelegramConfig } from "./client";

export const alertDatner = (msg: string | Format.FmtString) =>
  TelegramConfig.pipe(
    Effect.flatMap((config) =>
      Effect.tryPromise(() => new Telegram(config.botToken).sendMessage(config.datnerId, msg))
    ),
    Effect.catchAllCause((cause) => Effect.logError("Failed to send message to Telegram", cause)),
    Effect.withConfigProvider(ConstantCaseConfigProvider),
  );

export const sendJson = (json: unknown) =>
  Effect.flatMap(
    TelegramService,
    t =>
      Effect.promise(() => t.bot.sendMessage(t.config.chatId, Format.pre("json")(JSON.stringify(json, undefined, 2)))),
  ).pipe(
    Effect.catchAllCause((cause) => Effect.logError("Failed to send message to Telegram", cause)),
  );

export const notify = (msg: string | Format.FmtString) =>
  TelegramConfig.pipe(
    Effect.flatMap((config) => Effect.tryPromise(() => new Telegram(config.botToken).sendMessage(config.chatId, msg))),
    Effect.catchAllCause((cause) => Effect.logError("Failed to send message to Telegram", cause)),
    Effect.withConfigProvider(ConstantCaseConfigProvider),
  );
