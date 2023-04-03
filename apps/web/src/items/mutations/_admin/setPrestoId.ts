import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import db from "db";
import { Item } from "shared";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

const PrestoId = Schema.struct({
  itemId: Item.Id,
  prestoId: Schema.string,
});

const setPrestoId = resolver.pipe(
  (i: Schema.From<typeof PrestoId>) => Schema.parseEffect(PrestoId)(i),
  Effect.zipLeft(Session.ensureSuperAdmin),
  Effect.flatMap((input) =>
    Effect.tryCatchPromise(
      () =>
        db.item.update({
          where: {
            id: input.itemId,
          },
          data: { managementRepresentation: { _tag: "PrestoRepresentation", id: input.prestoId } },
        }),
      prismaError("Item"),
    )
  ),
  Session.authorizeResolver,
  Renu.runPromise$,
);

export default setPrestoId
