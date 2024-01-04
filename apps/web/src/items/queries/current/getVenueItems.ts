import { resolver } from "@blitzjs/rpc";
import { Schema, TreeFormatter } from "@effect/schema";
import { Console, Effect } from "effect";
import { Item } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";
import { inspect } from "util";

const includeContent = Schema.decode(Item.withContent);
const encodeItemWithContent = Schema.encode(Schema.array(Item.ItemWithContent));

const getCurrentVenueItems = resolver.pipe(
  Resolver.schema(Schema.undefined),
  Resolver.authorize(),
  Resolver.tap((_, ctx) => Console.log(inspect(ctx.session.$publicData))),
  Resolver.flatMap((_, ctx) => Item.getByVenue(ctx.session.venue.id, ctx.session.organization.id)),
  Effect.flatMap(Effect.forEach(_ => includeContent(_), { batching: true })),
  Effect.flatMap(encodeItemWithContent),
  Effect.catchTag("ParseError", _ => Effect.fail(TreeFormatter.formatErrors(_.errors))),
  Effect.withLogSpan("query.getCurrentVenueItems"),
  Renu.runPromise$,
);

export default getCurrentVenueItems;
