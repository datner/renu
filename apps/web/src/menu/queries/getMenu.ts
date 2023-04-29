import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Venue } from "shared";
import { Renu } from "src/core/effect";

const GetMenu = Schema.struct({
  identifier: Venue.Identifier,
});

export default resolver.pipe(
  (i: Schema.From<typeof GetMenu>) => Schema.decode(GetMenu)(i),
  (where) =>
    pipe(
      Venue.getByIdentifier(where.identifier),
      Effect.flatMap(Schema.decodeEffect(Venue.Menu.fromVenue)),
      Effect.flatMap(Schema.encodeEffect(Venue.Menu.Menu)),
      Effect.withParallelism(1),
      Renu.runPromise$,
    ),
);
