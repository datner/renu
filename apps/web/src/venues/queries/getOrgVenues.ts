import { resolver } from "@blitzjs/rpc";
import db from "db";
import * as Effect from "effect/Effect";
import { prismaError } from "src/core/helpers/prisma";

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  Effect.runPromise(
    Effect.tryPromise({
      try: () =>
        db.venue.findMany({
          where: { organizationId: ctx.session.organization.id },
          include: { content: true },
        }),
      catch: prismaError("Venue"),
    }),
  ));
