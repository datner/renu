import { SecurePassword } from "@blitzjs/auth/secure-password";
import { resolver } from "@blitzjs/rpc";
import { Schema } from "@effect/schema";
import { AuthenticationError } from "blitz";
import { Effect, pipe } from "effect";
import { Database } from "shared/Database";
import { Renu } from "src/core/effect";
import { Resolver } from "..";

const verify = (hashedPassword: string | null, password: string) =>
  Effect.promise(() => SecurePassword.verify(hashedPassword, password));

const isValid = (symb: symbol): symb is typeof SecurePassword.VALID_NEEDS_REHASH =>
  symb === SecurePassword.VALID_NEEDS_REHASH
  || symb === SecurePassword.VALID;

const hashPassword = Effect.serviceFunctionEffect(
  Database,
  db => (id: number, password: string) =>
    Effect.flatMap(
      Effect.promise(() => SecurePassword.hash(password)),
      hashedPassword => Effect.promise(() => db.user.update({ where: { id }, data: { hashedPassword } })),
    ),
);

export const getUserById = Effect.serviceFunctionEffect(Database, db => (id: number) =>
  Effect.tryPromise({
    try: () => db.user.findUniqueOrThrow({ where: { id } }),
    catch: () => new AuthenticationError(),
  }));

export const verifyPassword = (hashedPassword: string | null, password: string) =>
  Effect.filterOrFail(verify(hashedPassword, password), isValid, () => new AuthenticationError());

export const Password = pipe(
  Schema.string,
  Schema.compose(Schema.Trim),
  Schema.minLength(10, { message: () => "Password has to be at least 10 characters" }),
  Schema.maxLength(100, { message: () => "Ok thats too long." }),
);

export const ChangePassword = Schema.struct({
  currentPassword: Schema.string,
  newPassword: Password,
});

export default resolver.pipe(
  Resolver.schema(ChangePassword),
  Resolver.authorize(),
  Resolver.flatMap(({ currentPassword, newPassword }, ctx) =>
    pipe(
      getUserById(ctx.session.userId),
      Effect.tap(_ => verifyPassword(_.hashedPassword, currentPassword)),
      Effect.flatMap(_ => hashPassword(_.id, newPassword)),
    )
  ),
  Effect.isSuccess,
  Renu.runPromise$,
);
