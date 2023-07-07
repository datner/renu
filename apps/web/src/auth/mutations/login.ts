import { PublicData } from "@blitzjs/auth";
import { SecurePassword } from "@blitzjs/auth/secure-password";
import { resolver } from "@blitzjs/rpc";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { AuthenticationError, NotFoundError } from "blitz";
import { Prisma } from "database";
import { Database } from "shared/Database";
import { Renu } from "src/core/effect";
import { Resolver } from "..";

export const Login = Schema.struct({
  email: Schema.string,
  password: Schema.string,
});

const withMembership = {
  membership: { include: { affiliations: { include: { Venue: true } }, organization: true } },
} satisfies Prisma.UserInclude;

const verify = (hashedPassword: string | null, password: string) =>
  Effect.promise(() => SecurePassword.verify(hashedPassword, password));

const isValidNeedsRehash = (symb: symbol): symb is typeof SecurePassword.VALID_NEEDS_REHASH =>
  symb === SecurePassword.VALID_NEEDS_REHASH;

const rehashPassword = Effect.serviceFunctionEffect(
  Database,
  db => ({ password, email }: Schema.To<typeof Login>) =>
    Effect.flatMap(
      Effect.promise(() => SecurePassword.hash(password)),
      hashedPassword => Effect.promise(() => db.user.update({ where: { email }, data: { hashedPassword } })),
    ),
);

const getUser = Effect.serviceFunctionEffect(Database, db => (email: string) =>
  Effect.tryPromise({
    try: () => db.user.findFirstOrThrow({ where: { email }, include: withMembership }),
    catch: () => new AuthenticationError(),
  }
  ));

export default resolver.pipe(
  Resolver.schema(Login),
  Effect.flatMap((_) =>
    Effect.tap(getUser(_.email), user =>
      Effect.filterOrElse(
        verify(user.hashedPassword, _.password),
        {
        filter: isValidNeedsRehash,
        orElse: () => rehashPassword(_),
        }
      ))
  ),
  Effect.bindTo("user"),
  Effect.bind(
    "membership",
    _ =>
      Effect.orElseFail(
        A.head(_.user.membership),
        () => new NotFoundError(`User is not associated with any organizations`),
      ),
  ),
  Effect.bind(
    "affiliation",
    _ =>
      Effect.orElseFail(
        A.head(_.membership.affiliations),
        () => new NotFoundError(`User is not affiliated with any venues`),
      ),
  ),
  Effect.map((_): PublicData => ({
    userId: _.user.id,
    organization: _.membership.organization,
    venue: _.affiliation.Venue,
    roles: [_.user.role, _.membership.role],
    orgId: _.membership.organizationId,
  })),
  Resolver.flatMap((_, ctx) => Effect.promise(() => ctx.session.$create(_))),
  Renu.runPromise$,
);
