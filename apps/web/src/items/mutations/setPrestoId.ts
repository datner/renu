import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Item } from "shared";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";

const UpdatePrestoId = Schema.struct({
  id: Item.Id,
  prestoId: Schema.number,
});

export default resolver.pipe(
  (i: Schema.From<typeof UpdatePrestoId>) => Schema.decodeEffect(UpdatePrestoId)(i),
  Effect.tap(() => Session.ensureOrgVenueMatch),
  Effect.flatMap((_) => Item.setPrestoId(_.id, _.prestoId)),
  Session.authorizeResolver,
  Renu.runPromise$,
);
