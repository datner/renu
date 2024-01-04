import { resolver } from "@blitzjs/rpc";
import * as Management from "@integrations/management";
import db from "db";
import { Effect } from "effect";
import * as Renu from "src/core/effect/runtime";
import { prismaError } from "src/core/helpers/prisma";
import { ofVenue } from "../helpers/query-filters";

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  Effect.tryPromise({
    try: () =>
      db.managementIntegration.findUniqueOrThrow({
        where: ofVenue(ctx.session.venue.id),
      }),
    catch: prismaError("ManagementIntegration"),
  }).pipe(
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
