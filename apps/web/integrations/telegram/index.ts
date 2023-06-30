import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import { Telegram as TelegramClient } from "telegraf";
import { TelegramConfig } from "./client";

export interface Telegram {
  readonly _: unique symbol;
}

export interface TelegramService {
  readonly bot: TelegramClient;
  readonly config: Readonly<{
    botToken: string;
    chatId: string;
    datnerId: string;
  }>;
}
export const TelegramService = Context.Tag<Telegram, TelegramService>("Telegram");

export const layer = Layer.effect(
  TelegramService,
  pipe(
    Effect.config(TelegramConfig),
    Effect.bindTo("config"),
    Effect.let("bot", ({ config }) => new TelegramClient(config.botToken)),
  ),
);
