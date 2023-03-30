import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import db from "db";
import { pipe } from "fp-ts/function";
import { prismaError } from "src/core/helpers/prisma";
import { belongsToOrg, isVenue } from "../helpers/queryFilters";

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    Effect.attemptCatchPromise(
      () =>
        db.venue.findFirstOrThrow({
          where: {
            AND: [belongsToOrg(ctx.session.organization.id), isVenue(ctx.session.venue.id)],
          },
          select: { open: true },
        }),
      prismaError("Venue"),
    ),
    Effect.catchTag("PrismaError", () => Effect.succeed({ open: false })),
    Effect.runPromise,
  ));
