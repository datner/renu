import { AuthenticatedMiddlewareCtx } from "blitz";
import * as E from "fp-ts/Either";

type NoVenueError = {
  tag: "NoVenueError";
};

export const getSessionVenue = E.fromNullableK({ tag: "NoVenueError" } as NoVenueError)(
  (s: AuthenticatedMiddlewareCtx) => s.session.venue,
);
