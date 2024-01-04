import { resolver } from "@blitzjs/rpc";
import db from "db";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import { prismaError } from "src/core/helpers/prisma";
import { belongsToOrg, isVenue } from "../helpers/queryFilters";

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    Effect.tryPromise({
      try: () =>
        db.venue.findFirstOrThrow({
          where: {
            AND: [belongsToOrg(ctx.session.organization.id), isVenue(ctx.session.venue.id)],
          },
          select: { open: true },
        }),
      catch: prismaError("Venue"),
    }),
    Effect.catchTag("PrismaError", () => Effect.succeed({ open: false })),
    Effect.runPromise,
  ));
