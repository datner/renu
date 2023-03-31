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
      Effect.tryCatchPromise(
        () => db.managementIntegration.findFirstOrThrow({ where: { Venue: { id: venue.id } } }),
        prismaError("ManagementIntegration"),
      )
    ),
    Effect.catchTag("PrismaError", (_) =>
      Session.withEffect((session) =>
        Effect.cond(
          () => _.options.resource === "ManagementIntegration" && !_.isValidationError,
          (): ManagementIntegration => ({
            id: -1,
            vendorData: {},
            venueId: session.venue.id,
            provider: "RENU",
          }),
          () => _,
        )
      )),
    Session.authorize(ctx),
    Renu.runPromise$,
  );
export default handler;
