import { AuthenticatedSessionContext } from "@blitzjs/auth";
import { Ctx } from "@blitzjs/next";
import * as Brand from "@effect/data/Brand";
import * as Context from "@effect/data/Context";
import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import { AuthenticationError, AuthorizationError, CSRFTokenMismatchError } from "blitz";
import { GlobalRole } from "database";
import db from "db";

export interface AuthenticationErrorCase extends Data.Case {
  readonly _tag: "AuthenticationErrorCase";
  readonly message: string;
}
export const AuthenticationErrorCase = Data.tagged<AuthenticationErrorCase>("AuthenticationErrorCase");

export interface AuthorizationErrorCase extends Data.Case {
  readonly _tag: "AuthorizationErrorCase";
  readonly message: string;
}
export const AuthorizationErrorCase = Data.tagged<AuthorizationErrorCase>("AuthorizationErrorCase");

export interface CSRFTokenMismatchErrorCase extends Data.Case {
  readonly _tag: "CSRFTokenMismatchErrorCase";
  readonly message: string;
}
export const CSRFTokenMismatchErrorCase = Data.tagged<CSRFTokenMismatchErrorCase>(
  "CSRFTokenMismatchErrorCase",
);

export interface VenueOrgMismatchError extends Data.Case {
  readonly _tag: "VenueOrgMismatchError";
}
export const VenueOrgMismatchError = Data.tagged<VenueOrgMismatchError>("VenueOrgMismatchError");

export const Session = Context.Tag<AuthenticatedSessionContext>();

export type AuthError =
  | AuthenticationErrorCase
  | AuthorizationErrorCase
  | CSRFTokenMismatchErrorCase;

export const ensureOrgVenueMatch = Effect.asUnit(
  Effect.filterOrFail(
    Session,
    (session) => session.venue.organizationId === session.organization.id,
    VenueOrgMismatchError,
  ),
);

const curryEffect =
  <T extends Context.Tag<any, any>>(tag: T) => <R, E, A>(f: (s: Context.Tag.Service<T>) => Effect.Effect<R, E, A>) =>
    Effect.flatMap(tag, f);

const curryWith = <T extends Context.Tag<any, any>>(tag: T) => <A>(f: (s: Context.Tag.Service<T>) => A) =>
  Effect.map(tag, f);

export const withEffect = curryEffect(Session);
const _with = curryWith(Session);
export { _with as with };

export const Organization = Effect.map(Session, s => s.organization);
export const Venue = Effect.map(Session, s => s.venue);

export const ensureSuperAdmin = withEffect((session) =>
  pipe(
    Effect.try(() => session.$authorize(GlobalRole.SUPER)),
    Effect.orElse(() =>
      pipe(
        O.fromNullable(session.impersonatingFromUserId),
        Effect.getOrFailDiscard,
        Effect.flatMap((id) => Effect.tryPromise(() => db.user.findUniqueOrThrow({ where: { id } }))),
        Effect.filterOrDieMessage((u) => u.role === GlobalRole.SUPER, "how did you impersonate?"),
      )
    ),
    Effect.asUnit,
  )
);

export type AuthenticatedSession = AuthenticatedSessionContext & Brand.Brand<"AuthenticatedSession">;

export const authorize = (ctx: Ctx) =>
  Effect.provideServiceEffect(
    Session,
    Effect.tryCatch(
      () => {
        ctx.session.$authorize();
        return ctx.session as AuthenticatedSession;
      },
      (error): AuthError => {
        if (error instanceof AuthenticationError) {
          return AuthenticationErrorCase({ message: error.message });
        }
        if (error instanceof AuthorizationError) {
          return AuthorizationErrorCase({ message: error.message });
        }
        if (error instanceof CSRFTokenMismatchError) {
          return CSRFTokenMismatchErrorCase({ message: error.message });
        }
        throw new Error("unexpected error ");
      },
    ),
  );

export const authorizeResolver: <R, E, A, C extends Ctx>(
  self: Effect.Effect<R, E, A>,
  ctx: C,
) => Effect.Effect<Exclude<R, AuthenticatedSessionContext>, AuthError | E, A> = (self, ctx) => authorize(ctx)(self);
