import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { Effect } from "effect";
import { Item } from "shared";
import { Resolver, Session } from "src/auth";
import { Renu } from "src/core/effect";

const UpdatePrestoId = Schema.struct({
  id: Item.Id,
  prestoId: Schema.number,
});

export default resolver.pipe(
  Resolver.schema(UpdatePrestoId),
  Resolver.authorize(),
  Resolver.flatMap(Resolver.esnureOrgVenueMatch),
  Effect.flatMap((_) => Item.setPrestoId(_.id, _.prestoId)),
  Session.authorizeResolver,
  Renu.runPromise$,
);
