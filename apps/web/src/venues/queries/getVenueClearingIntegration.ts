import { resolver } from "@blitzjs/rpc";
import { Schema } from "@effect/schema";
import { Effect } from "effect";
import { Venue } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const getVenueClearingIntegration = resolver.pipe(
  Resolver.schema(Venue.Clearing.fromVenue),
  Effect.flatMap(Schema.encode(Venue.Clearing.ClearingIntegration)),
  Renu.runPromise$,
);

export default getVenueClearingIntegration;
