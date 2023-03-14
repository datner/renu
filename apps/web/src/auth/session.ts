import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import * as Brand from "@effect/data/Brand"
import * as Data from "@effect/data/Data"
import * as O from "@effect/data/Option"
import { pipe } from "@effect/data/Function"
import { Ctx } from "@blitzjs/next"
import { AuthorizationError, AuthenticationError, CSRFTokenMismatchError } from "blitz"
import { AuthenticatedSessionContext } from "@blitzjs/auth"
import { GlobalRole } from "database"
import db from "db"

export interface AuthenticationErrorCase extends Data.Case {
  readonly _tag: "AuthenticationErrorCase"
  readonly message: string
}
export const AuthenticationErrorCase =
  Data.tagged<AuthenticationErrorCase>("AuthenticationErrorCase")

export interface AuthorizationErrorCase extends Data.Case {
  readonly _tag: "AuthorizationErrorCase"
  readonly message: string
}
export const AuthorizationErrorCase = Data.tagged<AuthorizationErrorCase>("AuthorizationErrorCase")

export interface CSRFTokenMismatchErrorCase extends Data.Case {
  readonly _tag: "CSRFTokenMismatchErrorCase"
  readonly message: string
}
export const CSRFTokenMismatchErrorCase = Data.tagged<CSRFTokenMismatchErrorCase>(
  "CSRFTokenMismatchErrorCase"
)

export interface VenueOrgMismatchError extends Data.Case {
  readonly _tag: "VenueOrgMismatchError"
}
export const VenueOrgMismatchError = Data.tagged<VenueOrgMismatchError>("VenueOrgMismatchError")

export const Tag = Context.Tag<AuthenticatedSessionContext>()

export type AuthError =
  | AuthenticationErrorCase
  | AuthorizationErrorCase
  | CSRFTokenMismatchErrorCase

export const ensureOrgVenuMatch = Effect.asUnit(
  Effect.filterOrFail(
    Effect.service(Tag),
    (session) => session.venue.organizationId === session.organization.id,
    VenueOrgMismatchError
  )
)

const curryEffect =
  <T extends Context.Tag<any>>(tag: T) =>
  <R, E, A>(f: (s: Context.Tag.Service<T>) => Effect.Effect<R, E, A>) =>
    Effect.serviceWithEffect(tag, f)

const curryWith =
  <T extends Context.Tag<any>>(tag: T) =>
  <A>(f: (s: Context.Tag.Service<T>) => A) =>
    Effect.serviceWith(tag, f)

export const get = Effect.service(Tag)
export const withEffect = curryEffect(Tag)
const _with = curryWith(Tag)
export { _with as with }

export const ensureSuperAdmin = withEffect((session) =>
  pipe(
    Effect.attempt(() => session.$authorize(GlobalRole.SUPER)),
    Effect.orElse(() =>
      pipe(
        O.fromNullable(session.impersonatingFromUserId),
        Effect.getOrFailDiscard,
        Effect.flatMap((id) =>
          Effect.tryPromise(() => db.user.findUniqueOrThrow({ where: { id } }))
        ),
        Effect.filterOrDieMessage((u) => u.role === GlobalRole.SUPER, "how did you impersonate?")
      )
    ),
    Effect.asUnit
  )
)

export type AuthenticatedSession = AuthenticatedSessionContext & Brand.Brand<"AuthenticatedSession">

export const authorize = (ctx: Ctx) =>
  Effect.provideServiceEffect(
    Tag,
    Effect.tryCatch(
      () => {
        ctx.session.$authorize()
        return ctx.session as AuthenticatedSession
      },
      (error): AuthError => {
        if (error instanceof AuthenticationError) {
          return AuthenticationErrorCase({ message: error.message })
        }
        if (error instanceof AuthorizationError) {
          return AuthorizationErrorCase({ message: error.message })
        }
        if (error instanceof CSRFTokenMismatchError) {
          return CSRFTokenMismatchErrorCase({ message: error.message })
        }
        throw new Error("unexpected error ")
      }
    )
  )
