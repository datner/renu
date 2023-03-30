import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Management from "@integrations/management";
import db from "db";
import * as Renu from "src/core/effect/runtime";
import { prismaError } from "src/core/helpers/prisma";
import { ofVenue } from "../helpers/query-filters";

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    Effect.attemptCatchPromise(
      () =>
        db.managementIntegration.findUniqueOrThrow({
          where: ofVenue(ctx.session.venue.id),
        }),
      prismaError("ManagementIntegration"),
    ),
    Effect.flatMap((int) =>
      Effect.all({
        integration: Effect.succeed(int),
        menu: Effect.provideService(
          Management.getVenueMenu,
          Management.Integration,
          int,
        ),
      })
    ),
    Renu.runPromise$,
  ));
