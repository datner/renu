import { resolver } from "@blitzjs/rpc";
import { Schema } from "@effect/schema";
import { Effect } from "effect";
import { Database } from "shared/Database";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

export default resolver.pipe(
  Resolver.schema(Schema.struct({ path: Schema.string })),
  Resolver.authorize(),
  Resolver.flatMap(({ path }, ctx) =>
    Effect.andThen(Database, db => db.venue.update({ where: { id: ctx.session.venue.id }, data: { logo: path } }))
  ),
  Renu.runPromise$,
);
