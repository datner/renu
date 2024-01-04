import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { Cause, Console, Effect } from "effect";
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
  Effect.flatMap(Schema.parse(Venue.Menu.FromVenue)),
  Effect.tap(Console.log("got from menu")),
  Effect.andThen(Schema.encode(Venue.Menu.Menu.struct)),
  Effect.tap(Console.log("encoded to menu")),
  Effect.tapErrorCause(_ => Console.error(Cause.pretty(_))),
  Renu.runPromise$,
);
