import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { Database, Item } from "shared";
import { accessing } from "shared/effect/Context";
import { Common } from "shared/schema";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";

const IdOrSlug = Schema.union(Schema.number, Common.Slug);

export const FullItem = Schema.extend(
  Schema.struct({
    content: Schema.array(Common.Content),
    modifiers: Schema.array(Item.Modifier.fromPrisma),
  }),
)(Item.Item);

export const toFullItem = Schema.transformResult(
  Schema.from(Item.Item),
  FullItem,
  (i) =>
    pipe(
      Effect.allPar(
        Item.getContent(i.id),
        Item.getModifiers(i.id),
      ),
      Effect.map(([content, modifiers]) => ({ ...i, content, modifiers })),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database.Database),
    ),
  ParseResult.success,
);

export default resolver.pipe(
  (_: Schema.From<typeof IdOrSlug>) => Schema.decodeEffect(IdOrSlug)(_),
  Effect.zipLeft(Session.ensureOrgVenueMatch),
  Effect.flatMap(_ =>
    Effect.if(
      typeof _ === "number",
      Item.getById(_ as number),
      Item.getByIdentifier(_ as Common.Slug),
    )
  ),
  Effect.flatMap(Schema.decodeEffect(toFullItem)),
  Effect.flatMap(Schema.encodeEffect(FullItem)),
  Session.authorizeResolver,
  Renu.runPromise$
);
