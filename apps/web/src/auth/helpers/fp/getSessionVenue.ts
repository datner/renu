import * as E from "fp-ts/Either"
import { AuthenticatedMiddlewareCtx } from "blitz"

type NoVenueError = {
  tag: "NoVenueError"
}

export const getSessionVenue = E.fromNullableK({ tag: "NoVenueError" } as NoVenueError)(
  (s: AuthenticatedMiddlewareCtx) => s.session.venue
)
