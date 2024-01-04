import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import db from "db";
import { Cause, Console, Effect } from "effect";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";
import * as _Menu from "src/menu/schema";

const _removeCategory = (id: _Menu.CategoryId, ctx: Ctx) =>
  pipe(
    Session.ensureSuperAdmin,
    Effect.flatMap(() =>
      Effect.tryPromise({
        try: () =>
          db.category.update({
            where: { id },
            data: { deleted: new Date() },
          }),
        catch: prismaError("Category"),
      })
    ),
    Session.authorize(ctx),
    Effect.tapErrorCause((c) => Console.log(Cause.pretty(c))),
    Renu.runPromise$,
  );

export default _removeCategory;
