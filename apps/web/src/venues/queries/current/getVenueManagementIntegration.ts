import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import db, { ManagementIntegration } from "db";
import { Session } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";

const handler = (_: null, ctx: Ctx) =>
  pipe(
    Session.with((session) => session.venue),
    Effect.tap((a) => Effect.log(inspect(a))),
    Effect.flatMap((venue) =>
      Effect.tryPromise({
        try: () => db.managementIntegration.findFirstOrThrow({ where: { Venue: { id: venue.id } } }),
        catch: prismaError("ManagementIntegration"),
      })
    ),
    Effect.catchTag("PrismaError", (_) =>
      Session.withEffect((session) =>
        Effect.if(
          _.options.resource === "ManagementIntegration" && !_.isValidationError,
          {
            onTrue: Effect.sync((): ManagementIntegration => ({
              id: -1,
              vendorData: {},
              venueId: session.venue.id,
              provider: "RENU",
            })),
            onFalse: Effect.fail(_),
          },
        )
      )),
    Session.authorize(ctx),
    Renu.runPromise$,
  );
export default handler;
