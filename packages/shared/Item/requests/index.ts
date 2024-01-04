import { Effect, Option } from "effect";
import * as ModifierConfig from "../../modifier-config";
import { Common } from "../../schema";
import * as Item from "../item";
import * as Modifier from "../modifier";
import { GetItemById } from "./getById";
import { GetItemByIdentifier } from "./getByIdentifier";
import { GetItemsByVenue } from "./getByVenue";
import { GetItemContent } from "./getContent";
import { GetItemModifierById } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";
import { ItemResolver } from "./resolver";
import { SetModifierConfig } from "./setModifierConfig";
import { SetPrestoId } from "./setPrestoId";

export const getById = (id: number, venueId?: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetItemById({ id, venueId: Option.fromNullable(venueId) }),
    ItemResolver,
  ));

export const getByIdentifier = (identifier: Common.Slug, venueId?: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetItemByIdentifier({ identifier, venueId: Option.fromNullable(venueId) }),
    ItemResolver,
  ));

export const getContent = (id: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetItemContent({ id }),
    ItemResolver,
  ));

export const getModifiers = (id: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetItemModifiers({ id }),
    ItemResolver,
  ));

export const getModifierById = (id: number) =>
  Effect.request(
    GetItemModifierById({ id }),
    ItemResolver,
  );

export const getByVenue = (venueId: number, orgId: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetItemsByVenue({ venueId, orgId }),
    ItemResolver,
  ));

export const setPrestoId = (id: Item.Id, prestoId: number) =>
  Effect.request(
    SetPrestoId({ id, prestoId }),
    ItemResolver,
  );

export const setModifierConfig = (id: Modifier.Id, config: ModifierConfig.Schema) =>
  Effect.request(
    SetModifierConfig({ id, config }),
    ItemResolver,
  );
