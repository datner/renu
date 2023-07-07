import * as Effect from "@effect/io/Effect";
import { Slug } from "../../schema/common";
import { GetVenueById } from "./getById";
import { GetVenueByIdentifier } from "./getByIdentifier";
import { GetVenueCategories } from "./getCategories";
import { GetVenueClearingIntegration } from "./getClearingIntegration";
import { GetVenueContent } from "./getContent";
import { GetVenueManagementIntegration } from "./getManagementIntegration";
import { VenueResolver } from "./resolver";

export const getById = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetVenueById({ id }),
    VenueResolver,
  ));

Effect.withRequestBatching
export const getByIdentifier = (identifier: Slug) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetVenueByIdentifier({ identifier }),
    VenueResolver,
  ));

export const getContent = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetVenueContent({ id }),
    VenueResolver,
  ));

export const getCategories = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetVenueCategories({ id }),
    VenueResolver,
  ));

export const getClearing = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetVenueClearingIntegration({ id }),
    VenueResolver,
  ));

export const getManagement = (id: number) =>
  Effect.withRequestCaching("on")(Effect.request(
    GetVenueManagementIntegration({ id }),
    VenueResolver,
  ));
