import { Ctx } from "@blitzjs/next";
import db from "db";
import { Effect, pipe } from "effect";
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
          Effect.tryPromise({
            try: () =>
              db.item.findMany({
                where: {
                  Venue: { id: session.venue.id },
                  image: { not: "" },
                  deleted: null,
                  blurHash: null,
                },
                select: {
                  id: true,
                  image: true,
                },
              }),
            catch: prismaError("Item"),
          }),
          Effect.tap(Effect.logInfo),
          Effect.flatMap(
            Effect.forEach(_ => Effect.zip(Effect.succeed(_.id), getBlurHash(_.image)), { concurrency: 5 }),
          ),
          Effect.flatMap(Effect.forEach(([id, blurHash]) =>
            Effect.tryPromise({
              try: () => db.item.update({ where: { id }, data: { blurHash } }),
              catch: prismaError("Item"),
            }), { concurrency: 10, discard: true })),
        )
      )
    ),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default blurhashify;
