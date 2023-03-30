import { resolver } from "@blitzjs/rpc";
import { NotFoundError } from "blitz";
import db, { Prisma } from "db";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization";
import { ensureVenueRelatedToOrganization } from "src/auth/helpers/ensureVenueRelatedToOrganization";
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId";
import { setDefaultVenueId } from "src/auth/helpers/setDefaultVenueId";
import { prismaNotFound, prismaNotValid } from "src/core/helpers/prisma";
import { match, P } from "ts-pattern";
import { z } from "zod";

const ChangeState = z.object({ open: z.boolean() });

export default resolver.pipe(
  resolver.zod(ChangeState),
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenueId,
  ensureVenueRelatedToOrganization,
  ({ open, venueId }, ctx) =>
    pipe(
      TE.tryCatch(
        () => db.venue.update({ where: { id: venueId }, data: { open } }),
        (e) => e instanceof Prisma.PrismaClientValidationError ? prismaNotValid(e) : prismaNotFound(e),
      ),
      TE.chainFirstTaskK((venue) => () => ctx.session.$setPublicData({ venue: venue })),
      TE.getOrElse((e) => {
        throw match(e.cause)
          .with(
            P.intersection(P.instanceOf(Prisma.PrismaClientKnownRequestError), {
              code: "P2025" as const,
            }),
            (e) => new NotFoundError(e.message),
          )
          .with(P.instanceOf(Error), (e) => new Error(e.message))
          .with(
            { error: P.intersection(P.instanceOf(Error), P.select()) },
            (e) => new Error(e.message),
          )
          .otherwise((cause) => new Error("unknown error", { cause }));
      }),
    )(),
);
