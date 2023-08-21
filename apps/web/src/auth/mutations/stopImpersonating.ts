import { resolver } from "@blitzjs/rpc";
import { absurd } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { NotFoundError } from "blitz";
import { GlobalRole } from "db";
import { Database } from "shared";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";

const stopImpersonation = resolver.pipe(
  Resolver.schema(Schema.null),
  Resolver.authorize(),
  Resolver.flatMap((_, ctx) => Effect.fromNullable(() => ctx.session.impersonatingFromUserId)),
  Resolver.flatMap(Effect.serviceFunctionEffect(Database.Database, db => id =>
    Effect.tryPromise({
      try: () =>
        db.user.findUniqueOrThrow({
          where: { id },
          include: {
            membership: {
              include: { affiliations: { include: { Venue: true } }, organization: true },
            },
          },
        }),
      catch: () => new NotFoundError(`Could not find user with id ${id}`),
    }))),
  Resolver.flatMap((_, ctx) =>
    Effect.if(
      _.role === GlobalRole.SUPER,
      {
        onTrue: Effect.promise(() =>
          ctx.session.$create({
            userId: _.id,
            roles: [_.role],
            orgId: _.membership[0]?.organizationId ?? -1,
          })
        ),
        onFalse: Effect.tryMapPromise(A.head(_.membership), {
          try: (m) =>
            ctx.session.$create({
              userId: _.id,
              organization: m.organization,
              venue: m.affiliations[0]?.Venue,
              roles: [_.role, m.role],
              orgId: m.organizationId,
            }),
          catch: () => absurd,
        }),
      },
    )
  ),
  Renu.runPromise$,
);

export default stopImpersonation;
