import { Ctx } from "@blitzjs/next";
import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { AuthenticatedCtx, AuthenticationError, AuthorizationError, CSRFTokenMismatchError } from "blitz";
import { GlobalRole, MembershipRole } from "database";
import { absurd, Context, Data, Effect, Match, pipe, Pipeable } from "effect";

export type ResolverError = Data.TaggedEnum<{
  AuthorizationError: AuthorizationError;
  AuthenticationError: AuthenticationError;
  CSRFTokenMismatchError: CSRFTokenMismatchError;
  OrgVenueMismatchError: {};
}>;

export const ResolverError = Data.taggedEnum<ResolverError>();

export const liftError = Match.type<unknown>().pipe(
  Match.when(Match.instanceOf(AuthenticationError), ResolverError("AuthenticationError")),
  Match.when(Match.instanceOf(AuthorizationError), ResolverError("AuthorizationError")),
  Match.when(Match.instanceOf(CSRFTokenMismatchError), ResolverError("CSRFTokenMismatchError")),
  Match.orElse(_ => {
    throw absurd(_ as never);
  }),
);

export const schema = <I, A, C extends Ctx>(s: Schema.Schema<I, A>) => (input: I, _ctx: C) => Schema.decode(s)(input);

type Role = GlobalRole | MembershipRole;
type ResolverFn<Prev extends Effect.Effect<any, any, any>, Next, PrevCtx, NextCtx = PrevCtx> = (
  i: Prev,
  c: PrevCtx,
) => Next extends ResultWithContext<any, any> ? never : Next | ResultWithContext<Next, NextCtx>;

interface ResultWithContext<Result, Context> {
  __blitz: true;
  value: Result;
  ctx: Context;
}

export const authorize =
  (roles?: Role | Role[]) =>
  <I extends Effect.Effect<any, any, any>, C extends Ctx | AuthenticatedCtx>(
    self: I,
    ctx: C,
  ): ResultWithContext<I, AuthenticatedCtx> => {
    ctx.session.$authorize(roles);
    return ({
      __blitz: true,
      value: self,
      ctx: ctx as AuthenticatedCtx,
    });
  };

export const flatMap = <R, E, A, R1, E1, B, C extends Ctx | AuthenticatedCtx>(
  f: (a: A, ctx: C) => Effect.Effect<R1, E1, B>,
): ResolverFn<Effect.Effect<R, E, A>, Effect.Effect<R | R1, E | E1, B>, C> =>
<R, E>(self: Effect.Effect<R, E, A>, ctx: C) => Effect.flatMap(self, _ => f(_, ctx));

export const tap = <R, E, A, R1, E1, B, C extends Ctx | AuthenticatedCtx>(
  f: (a: A, ctx: C) => Effect.Effect<R1, E1, B>,
): ResolverFn<Effect.Effect<R, E, A>, Effect.Effect<R | R1, E | E1, A>, C> =>
<R, E>(self: Effect.Effect<R, E, A>, ctx: C) => Effect.tap(self, _ => f(_, ctx));

export const map = <A, C, B>(f: (a: A, ctx: C) => B) => <R, E>(self: Effect.Effect<R, E, A>, ctx: C) =>
  Effect.map(self, _ => f(_, ctx));

export const esnureOrgVenueMatch = <I>(_: I, ctx: AuthenticatedCtx) =>
  Effect.if(
    ctx.session.venue.organizationId === ctx.session.organization.id,
    {
      onTrue: Effect.succeed(_),
      onFalse: Effect.fail(ResolverError("OrgVenueMismatchError")()),
    },
  );

interface Authenticated {
  readonly _: unique symbol;
}
const Authenticated = Context.Tag<Authenticated, AuthenticatedCtx>();
