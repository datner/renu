import { resolver } from "@blitzjs/rpc"
import { Prisma } from "@prisma/client"
import { pipe } from "fp-ts/function"
import * as RA from "fp-ts/ReadonlyArray"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import { venueFindMany } from "../helpers/prisma"

type VenueWithContent = Prisma.VenueGetPayload<{ include: { content: true } }>

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    venueFindMany({
      where: { organizationId: ctx.session.organization.id },
      include: { content: true },
    }),
    TE.map(RA.fromArray),
    TE.getOrElse(() => T.of(RA.zero<VenueWithContent>()))
  )()
)
