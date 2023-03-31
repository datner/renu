import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import * as Cause from "@effect/io/Cause";
import * as Effect from "@effect/io/Effect";
import db from "db";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";
import * as _Menu from "src/menu/schema";

const _removeCategory = (id: _Menu.CategoryId, ctx: Ctx) =>
  pipe(
    Session.ensureSuperAdmin,
    Effect.flatMap(() =>
      Effect.tryCatchPromise(
        () =>
          db.category.update({
            where: { id },
            data: { deleted: new Date() },
          }),
        prismaError("Category"),
      )
    ),
    Session.authorize(ctx),
    Effect.tapError((c) => Effect.sync(() => console.log((c as Error).cause))),
    Effect.tapErrorCause((c) => Effect.sync(() => console.log(Cause.pretty(c)))),
    Renu.runPromise$,
  );

export default _removeCategory;
