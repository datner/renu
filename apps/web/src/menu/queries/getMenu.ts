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
  Effect.flatMap(Schema.decodeEffect(Venue.Menu.fromVenue)),
  Effect.flatMap(Schema.encodeEffect(Venue.Menu.Menu)),
  Effect.withParallelism(1),
  Renu.runPromise$,
);
