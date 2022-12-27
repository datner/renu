import { resolver } from "@blitzjs/rpc"
import { clients, getVenueMenu } from "integrations/management"
import { gotClient } from "integrations/http/gotHttpClient"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/lib/function"
import { delegate } from "src/core/helpers/prisma"
import { ofVenue } from "../helpers/query-filters"
import { breakers } from "integrations/http/circuitBreaker"
import db from "db"

const findFirstIntegration = delegate(db.managementIntegration)((mi) => mi.findUniqueOrThrow)

const cache = new Map()

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    TE.Do,
    TE.apS("integration", findFirstIntegration({ where: ofVenue(ctx.session.venue.id) })),
    TE.bindW("menu", ({ integration }) =>
      getVenueMenu()({
        managementIntegration: integration,
        managementClient: clients[integration.provider],
        httpClient: gotClient,
        circuitBreakerOptions: breakers[integration.provider],
        cache,
      })
    )
  )()
)
