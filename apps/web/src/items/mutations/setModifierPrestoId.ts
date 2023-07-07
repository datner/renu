import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Item, ModifierConfig } from "shared";
import { Resolver, Session } from "src/auth";
import { Renu } from "src/core/effect";
import { inspect } from "util";

const UpdatePrestoId = Schema.struct({
  id: Item.Modifier.Id,
  choice: Schema.string,
  prestoId: Schema.number,
});

export default resolver.pipe(
  Resolver.schema(UpdatePrestoId),
  Resolver.authorize(),
  Resolver.flatMap(Resolver.esnureOrgVenueMatch),
  Effect.flatMap((i) =>
    pipe(
      Item.getModifierById(i.id),
      Effect.flatMap(Schema.decode(Item.Modifier.fromPrisma)),
      Effect.map(_ => _.config),
      Effect.map(
        _ => ({
          ..._,
          // NOTE: types here are a fuck, this is safe but watch out
          options: (A.mapNonEmpty(_.options, (_) => ({
            ..._,
            managementRepresentation: _.identifier === i.choice
              ? ModifierConfig.Base.ManagementRepresentation("Presto")({ id: i.prestoId })
              : _.managementRepresentation,
          } as any))),
        }),
      ),
      Effect.tap(_ => Effect.sync(() => console.log(inspect(_, false, null, true)))),
      Effect.flatMap(_ => Item.setModifierConfig(i.id, _)),
    )
  ),
  Session.authorizeResolver,
  Renu.runPromise$,
);
