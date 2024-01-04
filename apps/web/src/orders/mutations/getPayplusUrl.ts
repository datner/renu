import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import * as Clearing from "@integrations/clearing";
import * as Payplus from "@integrations/payplus";
import { Effect } from "effect";
import { Order, Venue } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const getPageUrl = Effect.serviceFunctionEffect(Payplus.Tag, _ => _.getClearingPageLink);

const getPayplusUrl = resolver.pipe(
  Resolver.schema(Schema.struct({ venueId: Venue.Id, orderId: Order.Id })),
  Effect.flatMap(({ venueId, orderId }) =>
    Effect.provideServiceEffect(
      getPageUrl(orderId),
      Clearing.Settings,
      Effect.flatten(Venue.getClearing(venueId)),
    )
  ),
  Effect.map(_ => _.toString()),
  Renu.runPromise$,
);

export default getPayplusUrl;
