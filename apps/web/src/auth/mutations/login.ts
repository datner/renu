import { PublicData, SecurePassword } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import { AuthenticationError } from "blitz"
import { GlobalRole, Prisma } from "db"
import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { getMembership } from "../helpers/getMembership"
import { Login } from "../validations"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"
import { hashPassword, verifyPassword } from "../helpers/fp/securePassword"
import { findFirstUser, updateUser } from "src/users/helpers/prisma"

type AuthError = {
  tag: "AuthenticationError"
  error: AuthenticationError
}

export const authenticateUser =
  (password: string) =>
  <A extends Prisma.UserInclude, B extends Prisma.UserWhereUniqueInput>(args: {
    include: A
    where: B
  }) =>
    pipe(
      findFirstUser(args),
      TE.mapLeft((e) =>
        e.error instanceof PrismaClientKnownRequestError && e.error.code === "P2025"
          ? ({
              tag: "AuthenticationError" as const,
              error: new AuthenticationError(),
            } as AuthError)
          : e
      ),
      TE.chainW((user) =>
        pipe(
          verifyPassword(user.hashedPassword, password),
          TE.fromTask,
          TE.chain(
            TE.fromPredicate(
              (r) => r === SecurePassword.VALID_NEEDS_REHASH,
              () => hashPassword
            )
          ),
          TE.orLeft((hash) => hash(password)),
          TE.orElseW((hashedPassword) =>
            updateUser({ where: { id: user.id }, data: { hashedPassword } })
          ),
          TE.map(() => user)
        )
      ),
      TE.map(({ hashedPassword, ...user }) => user)
    )

const withMembership = {
  membership: { include: { affiliations: { include: { Venue: true } }, organization: true } },
} satisfies Prisma.UserInclude

type UserWithMembership = Prisma.UserGetPayload<{ include: typeof withMembership }>

const getPublicData = (user: Omit<UserWithMembership, "hashedPassword">) =>
  pipe(
    getMembership(user),
    E.map(
      (m): PublicData => ({
        userId: user.id,
        organization: m.organization,
        venue: m.affiliation.Venue,
        roles: [user.role, m.role],
        orgId: m.organizationId,
      })
    ),
    E.orElse((e) =>
      user.role === GlobalRole.SUPER
        ? E.right({
            userId: user.id,
            roles: [user.role],
            orgId: -1,
          } as PublicData)
        : E.throwError(e)
    )
  )

export default resolver.pipe(resolver.zod(Login), ({ email, password }, ctx) =>
  pipe(
    authenticateUser(password)({ include: withMembership, where: { email } }),
    TE.chainFirstW((user) =>
      pipe(
        getPublicData(user),
        TE.fromEither,
        TE.chainTaskK((s) => () => ctx.session.$create(s))
      )
    )
  )()
)
