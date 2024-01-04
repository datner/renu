import { resolver } from "@blitzjs/rpc";
import { ParseResult, Schema } from "@effect/schema";
import { Effect } from "effect";
import { Database, Item } from "shared";
import { accessing } from "shared/effect/Context";
import { Common } from "shared/schema";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";
import { FullItem } from "../helpers/form";

const IdOrSlug = Schema.union(Schema.number, Common.Slug);

export const toFullItem = Schema.transformOrFail(
  Schema.from(Item.Item),
  FullItem,
  (i) =>
    Effect.zip(
      Item.getContent(i.id),
      Item.getModifiers(i.id),
      { batching: true },
    ).pipe(
      Effect.map(([content, modifiers]) => ({ ...i, content, modifiers })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database.Database),
    ),
  _ => ParseResult.succeed(_),
);

export default resolver.pipe(
  Resolver.schema(IdOrSlug),
  Resolver.authorize(),
  Resolver.flatMap(Resolver.esnureOrgVenueMatch),
  Resolver.flatMap((_, { session }) =>
    Effect.unified(
      typeof _ === "number"
        ? Item.getById(_, session.venue.id)
        : Item.getByIdentifier(_, session.venue.id),
    )
  ),
  Effect.flatMap(Schema.decode(toFullItem)),
  Effect.flatMap(Schema.encode(FullItem)),
  Renu.runPromise$,
);
