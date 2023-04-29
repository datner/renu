import * as Option from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import { GetItemById } from "./getById";
import { GetItemContent } from "./getContent";
import { GetItemModifierById } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";
import { ItemResolver } from "./resolver";

export const getById = (id: number, venueId?: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetItemById({ id, venueId: Option.fromNullable(venueId) }),
    ItemResolver,
  ));

export const getContent = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetItemContent({ id }),
    ItemResolver,
  ));

export const getModifiers = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetItemModifiers({ id }),
    ItemResolver,
  ));

export const getModifierById = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetItemModifierById({ id }),
    ItemResolver,
  ));
