import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Venue } from "shared";
import { Resolver } from "src/auth";
import { prismaNotFound } from "src/core/helpers/prisma";

const ChangeVenue = Schema.number;

export default resolver.pipe(
  Resolver.schema(ChangeVenue),
  Resolver.authorize(),
  Resolver.flatMap(Venue.getById),
  Resolver.flatMap((_, ctx) =>
    Effect.succeed(_).pipe(
      Effect.filterOrFail(
        _ => _.organizationId === ctx.session.orgId,
        () => prismaNotFound("Venue does not belong to org"),
      ),
      Effect.flatMap(venue => Effect.promise(() => ctx.session.$setPublicData({ venue }))),
    )
  ),
);
