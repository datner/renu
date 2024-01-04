import { Ctx } from "@blitzjs/next";
import db, { ManagementIntegration } from "db";
import { Console, Effect } from "effect";
import { Session } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";

const handler = (_: null, ctx: Ctx) =>
  Session.with((session) => session.venue).pipe(
    Effect.tap((a) => Console.log(inspect(a))),
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
