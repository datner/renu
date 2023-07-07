import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Venue } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const GetMenu = Schema.struct({
  identifier: Venue.Identifier,
});

export default resolver.pipe(
  Resolver.schema(GetMenu),
  Effect.map(_ => _.identifier),
  Effect.flatMap(Venue.getByIdentifier),
  Effect.flatMap(Schema.decode(Venue.Menu.fromVenue)),
  Effect.flatMap(Schema.encode(Venue.Menu.Menu)),
  Renu.runPromise$,
);
