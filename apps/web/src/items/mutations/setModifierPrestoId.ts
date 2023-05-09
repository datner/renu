import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import * as Optic from "@fp-ts/optic";
import { Item, ModifierConfig } from "shared";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { inspect } from "util";

const UpdatePrestoId = Schema.struct({
  id: Item.Modifier.Id,
  choice: Schema.string,
  prestoId: Schema.number,
});

type F = ModifierConfig.OneOf.Option | ModifierConfig.Extras.Option | ModifierConfig.Slider.Option;

export default resolver.pipe(
  (i: Schema.From<typeof UpdatePrestoId>) => Schema.decodeEffect(UpdatePrestoId)(i),
  Effect.tap(() => Session.ensureOrgVenueMatch),
  Effect.flatMap((i) =>
    pipe(
      Item.getModifierById(i.id),
      Effect.flatMap(Schema.decodeEffect(Item.Modifier.fromPrisma)),
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
