import { Ctx } from "@blitzjs/next";
import { absurd, pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Match from "@effect/match";
import { TaggedEnum, taggedEnum } from "@effect/match/TaggedEnum";
import * as Schema from "@effect/schema/Schema";
import { AuthenticatedMiddlewareCtx, AuthenticationError, AuthorizationError, CSRFTokenMismatchError } from "blitz";
import { GlobalRole, MembershipRole } from "database";

export const ResolverError = taggedEnum<{
  AuthorizationError: AuthorizationError;
  AuthenticationError: AuthenticationError;
  CSRFTokenMismatchError: CSRFTokenMismatchError;
  OrgVenueMismatchError: {};
}>();

export type ResolverError = TaggedEnum.Infer<typeof ResolverError>;

export const liftError = pipe(
  Match.type<unknown>(),
  Match.when(Match.instanceOf(AuthenticationError), ResolverError("AuthenticationError")),
  Match.when(Match.instanceOf(AuthorizationError), ResolverError("AuthorizationError")),
  Match.when(Match.instanceOf(CSRFTokenMismatchError), ResolverError("CSRFTokenMismatchError")),
  Match.orElse(_ => {
    throw absurd(_ as never);
  }),
);

export const schema = <I, A, C extends Ctx>(s: Schema.Schema<I, A>) => (input: I, _ctx: C) =>
  Schema.decodeEffect(s)(input);

type Role = GlobalRole | MembershipRole;

export const authorize =
  (roles?: Role | Role[]) => <I extends Effect.Effect<any, any, any>, C extends Ctx>(self: I, ctx: C) => {
    ctx.session.$authorize(roles);
    return ({
      __blitz: true,
      value: self,
      ctx: ctx as AuthenticatedMiddlewareCtx,
    } as const);
  };

export const flatMap =
  <A, R1, E1, B, C extends Ctx>(f: (a: A, ctx: C) => Effect.Effect<R1, E1, B>) => <R, E>(self: Effect.Effect<R, E, A>, ctx: C) => ({
    __blitz: true,
    value: Effect.flatMap(self, _ => f(_, ctx)),
    ctx,
  } as const);

export const flatMapAuthorized =
  <A, R1, E1, B, C extends AuthenticatedMiddlewareCtx>(f: (a: A, ctx: C) => Effect.Effect<R1, E1, B>) => <R, E>(self: Effect.Effect<R, E, A>, ctx: C) => ({
    __blitz: true,
    value: Effect.flatMap(self, _ => f(_, ctx)),
    ctx,
  } as const);

export const map = <A, B, C>(f: (a: A, ctx: C) => B) => <R, E>(self: Effect.Effect<R, E, A>, ctx: C) => ({
  __blitz: true,
  value: Effect.map(self, _ => f(_, ctx)),
  ctx,
} as const);

export const esnureOrgVenueMatch = <I, C extends AuthenticatedMiddlewareCtx>(_: I, ctx: C) =>
  Effect.if(
    ctx.session.venue.organizationId === ctx.session.organization.id,
    Effect.succeed(_),
    Effect.fail(ResolverError("OrgVenueMismatchError")()),
  );
