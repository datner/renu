import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Item } from "shared";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";

const getCurrentVenueItems = (_: void, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenueMatch,
    Effect.zipRight(Session.Session),
    Effect.flatMap((sess) => Item.getByVenue(sess.venue.id, sess.organization.id)),
    Effect.flatMap(Effect.forEachPar(Schema.decodeEffect(Item.withContent))),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default getCurrentVenueItems;
