import * as Option from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import { GetItemById } from "./getById";
import { GetItemsByVenue } from "./getByVenue";
import { GetItemContent } from "./getContent";
import { GetItemModifierById } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";
import { ItemResolver } from "./resolver";
import { Common } from "../../schema";
import { GetItemByIdentifier } from "./getByIdentifier";

export const getById = (id: number, venueId?: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetItemById({ id, venueId: Option.fromNullable(venueId) }),
    ItemResolver,
  ));

export const getByIdentifier = (identifier: Common.Slug, venueId?: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetItemByIdentifier({ identifier, venueId: Option.fromNullable(venueId) }),
    ItemResolver,
  ));

export const getContent = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetItemContent({ id }),
    ItemResolver,
  ));

export const getModifiers = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetItemModifiers({ id }),
    ItemResolver,
  ));

export const getModifierById = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetItemModifierById({ id }),
    ItemResolver,
  ));

export const getByVenue = (venueId: number, orgId: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetItemsByVenue({ venueId, orgId }),
    ItemResolver,
  ));
