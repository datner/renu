import * as Either from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import { NotFoundError } from "blitz";
import { Affiliation, GlobalRole, Membership, Organization, Venue } from "db";

export const getMembership = (user: {
  id: number;
  role: GlobalRole;
  membership: (Membership & {
    affiliations: (Affiliation & { Venue: Venue })[];
    organization: Organization;
  })[];
}) =>
  pipe(
    A.head(user.membership),
    Either.fromOption(() => new NotFoundError(`User ${user.id} is not associated with any organizations`)),
    Either.flatMap(({ affiliations, ...rest }) =>
      A.head(affiliations).pipe(
        Either.fromOption(() => new NotFoundError(`User ${user.id} is not affiliated with any venues`)),
        Either.mapRight(affiliation => ({ ...rest, affiliation })),
      )
    ),
  );
