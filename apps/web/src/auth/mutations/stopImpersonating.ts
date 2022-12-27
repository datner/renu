import { resolver } from "@blitzjs/rpc"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import db, { GlobalRole } from "db"
import { NotFoundError } from "blitz"
import { constVoid, pipe } from "fp-ts/lib/function"
import { getMembership } from "../helpers/getMembership"

export default resolver.pipe(resolver.authorize(), async (_, ctx) => {
  const userId = ctx.session.impersonatingFromUserId

  return pipe(
    userId,
    TE.fromNullable(() => "Already not impersonating anyone!"),
    TE.chainW(
      TE.tryCatchK(
        (id) =>
          db.user.findUniqueOrThrow({
            where: { id },
            include: {
              membership: {
                include: { affiliations: { include: { Venue: true } }, organization: true },
              },
            },
          }),
        () => new NotFoundError(`Could not find user with id ${userId}`)
      )
    ),
    TE.chainW((user) =>
      user.role === GlobalRole.SUPER
        ? pipe(
            TE.of(user),
            TE.chainFirstTaskK(
              (u) => () =>
                ctx.session.$create({
                  userId: u.id,
                  roles: [u.role],
                  orgId: -1,
                })
            )
          )
        : pipe(
            TE.of(user),
            TE.bindTo("user"),
            TE.bindW("membership", ({ user }) => TE.fromEither(getMembership(user))),
            TE.chainFirstTaskK(
              ({ membership: m, user }) =>
                () =>
                  ctx.session.$create({
                    userId: user.id,
                    organization: m.organization,
                    venue: m.affiliation.Venue,
                    roles: [user.role, m.role],
                    orgId: m.organizationId,
                  })
            ),
            TE.map(({ user }) => user)
          )
    ),
    TE.getOrElseW((e) => {
      if (typeof e === "string") {
        console.log("You're not impersonating anyone!")
        return T.of(constVoid())
      }
      throw e
    })
  )()
})
