import { NotFoundError } from "blitz";
import { Affiliation, GlobalRole, Membership, Organization, Venue } from "db";
import { Either, pipe, ReadonlyArray as A } from "effect";

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
        Either.map(affiliation => ({ ...rest, affiliation })),
      )
    ),
  );
