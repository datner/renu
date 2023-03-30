import db, { Prisma, PrismaClient } from "db";
import * as TE from "fp-ts/TaskEither";
import { match, P } from "ts-pattern";

export interface PrismaErrorOptions extends ErrorOptions {
  resource?: Prisma.ModelName;
  isValidationError?: boolean;
  code?: string | undefined;
}

export class PrismaError extends Error {
  readonly _tag = "PrismaError";
  readonly isValidationError: boolean;
  readonly code: string | undefined;
  constructor(readonly message: string, readonly options: PrismaErrorOptions) {
    super(message, options);
    this.isValidationError = Boolean(options.isValidationError);
    this.code = options.code;
  }
}

export const prismaNotFound = (cause: unknown) => new PrismaError("prisma did not find requested resource", { cause });

export const prismaNotValid = (cause: unknown) => new PrismaError("prisma encountered a validation error", { cause });

export const prismaError = (resource: Prisma.ModelName) => (cause: unknown) => {
  const message = match(cause)
    .with(
      P.intersection(P.instanceOf(Prisma.PrismaClientKnownRequestError), {
        code: "P2025",
      }),
      () => "prisma did not find requested resource from " + resource,
    )
    .with(
      P.instanceOf(Prisma.PrismaClientValidationError),
      () => "prisma encountered a validation error",
    )
    .otherwise(() => "prisma has thrown an error");

  return new PrismaError(message, {
    cause,
    resource,
    isValidationError: cause instanceof Prisma.PrismaClientValidationError,
    code: cause instanceof Prisma.PrismaClientKnownRequestError
      ? cause.code
      : undefined,
  });
};

export const getVenueById = <Include extends Prisma.VenueInclude>(include: Include) => (id: number) =>
  TE.tryCatch(
    () =>
      db.venue.findUniqueOrThrow({
        where: { id },
        include,
      }),
    prismaNotFound,
  );

type PrismaClientDelegates = {
  [K in keyof PrismaClient]: K extends `\$${string}` ? never : K;
}[keyof PrismaClient];

type PrismaDelegates = PrismaClient[PrismaClientDelegates];

export const delegate = <Delegate extends PrismaDelegates>(d: Delegate) =>
<A extends unknown[], B>(
  f: (d: Delegate) => (...opts: A) => Prisma.PrismaPromise<B>,
) => TE.tryCatchK(f(d), prismaError("UNKNOWN" as Prisma.ModelName));

export const getVenueByIdentifier = <Include extends Prisma.VenueInclude>(include?: Include) => (identifier: string) =>
  TE.tryCatch(
    () =>
      db.venue.findUniqueOrThrow({
        where: { identifier },
        include,
      }),
    prismaNotFound,
  );

export type QueryFilter<T> = (...args: any[]) => T;
