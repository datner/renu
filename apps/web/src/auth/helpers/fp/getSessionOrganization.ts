import { AuthenticatedMiddlewareCtx } from "blitz";
import * as E from "fp-ts/Either";

type NoOrgError = {
  tag: "NoOrgError";
};

export const getSessionOrganization = E.fromNullableK(() => ({ tag: "NoOrgError" } as NoOrgError))(
  (s: AuthenticatedMiddlewareCtx) => s.session.organization,
);
