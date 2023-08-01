import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import { Item } from "shared";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";

const getCurrentVenueItems = (_: void, ctx: Ctx) =>
  pipe(
    Session.ensureOrgVenueMatch,
    Effect.zipRight(Session.Session),
    Effect.flatMap((sess) => Item.getByVenue(sess.venue.id, sess.organization.id)),
    Effect.flatMap(Effect.forEach(_ => Schema.decode(Item.withContent)(_), { batching: true })),
    Session.authorize(ctx),
    Effect.catchTag("ParseError", _ => Effect.fail(TreeFormatter.formatErrors(_.errors))),
    Renu.runPromise$,
  );

export default getCurrentVenueItems;
