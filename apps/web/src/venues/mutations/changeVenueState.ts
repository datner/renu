import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { ensureVenueRelatedToOrganization } from "src/auth/helpers/ensureVenueRelatedToOrganization"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenueId } from "src/auth/helpers/setDefaultVenueId"
import { prismaNotFound, prismaNotValid } from "src/core/helpers/prisma"
import { revalidateVenue } from "src/core/helpers/revalidation"
import { NotFoundError } from "blitz"
import db, { Prisma } from "db"
import { pipe } from "fp-ts/lib/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { z } from "zod"

const ChangeState = z.object({ open: z.boolean() })

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
        (e) =>
          e instanceof Prisma.PrismaClientValidationError ? prismaNotValid(e) : prismaNotFound(e)
      ),
      TE.chainFirstTaskK((venue) => () => ctx.session.$setPublicData({ venue: venue })),
      TE.chainFirstTaskK((venue) => revalidateVenue(venue.identifier)),
      TE.getOrElse((e) => {
        throw match(e)
          .with({ tag: "prismaNotFoundError" }, (e) => new NotFoundError(e.error.message))
          .with({ tag: "prismaValidationError" }, (e) => new Error(e.error.message))
          .exhaustive()
      })
    )()
)
