import { Ctx } from "@blitzjs/next";
import * as Chunk from "@effect/data/Chunk";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import db from "db";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { prismaError } from "src/core/helpers/prisma";

const blurhashify = (_: null, ctx: Ctx) =>
  pipe(
    Session.ensureSuperAdmin,
    Effect.flatMap(() =>
      Session.withEffect((session) =>
        pipe(
          Effect.tryCatchPromise(
            () =>
              db.item.findMany({
                where: {
                  Venue: { id: session.venue.id },
                  image: { not: "" },
                  deleted: null,
                  blurHash: null,
                },
              }),
            prismaError("Item"),
          ),
          Effect.map(A.map((it) => Effect.all(Effect.succeed(it.id), getBlurHash(it.image)))),
          Effect.flatMap((effects) => Effect.withParallelism(Effect.collectAllPar(effects), 5)),
          Effect.flatMap((items) =>
            pipe(
              Effect.collectAllParDiscard(
                Chunk.map(items, ([id, blurHash]) =>
                  Effect.tryCatchPromise(
                    () => db.item.update({ where: { id }, data: { blurHash } }),
                    prismaError("Item"),
                  )),
              ),
              Effect.withParallelism(10),
            )
          ),
        )
      )
    ),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default blurhashify;
