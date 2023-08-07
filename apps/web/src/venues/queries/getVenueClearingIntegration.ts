import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Venue } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const getVenueClearingIntegration = resolver.pipe(
  Resolver.schema(Venue.Clearing.fromVenue),
  Effect.flatMap(Schema.encode(Venue.Clearing.ClearingIntegration)),
  Renu.runPromise$,
);

export default getVenueClearingIntegration;
