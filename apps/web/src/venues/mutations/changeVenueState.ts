import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Database } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const ChangeState = Schema.struct({ open: Schema.boolean });

const changeVenueStatus = resolver.pipe(
  Resolver.schema(ChangeState),
  Resolver.authorize(),
  Resolver.flatMap(Resolver.esnureOrgVenueMatch),
  Resolver.flatMap(
    Effect.serviceFunctionEffect(Database.Database, db => (_, ctx) =>
      Effect.promise(() =>
        db.venue.update({
          where: { id: ctx.session.venue.id },
          data: { open: _.open },
        })
      )),
  ),
  Resolver.tap((venue, ctx) => Effect.promise(() => ctx.session.$setPublicData({ venue }))),
  Renu.runPromise$,
);

export default changeVenueStatus;
