import db, { Prisma, PrismaClient, PrismaPromise } from "db"
import * as TE from "fp-ts/TaskEither"

export interface PrismaErrorOptions extends ErrorOptions {
  resource?: Prisma.ModelName
}

export class PrismaError extends Error {
  readonly _tag = "PrismaError"
  constructor(public message: string, public options: PrismaErrorOptions) {
    super(message, options)
  }
}

export const prismaNotFound = (cause: unknown) =>
  new PrismaError("prisma did not find requested resource", { cause })

export const prismaNotValid = (cause: unknown) =>
  new PrismaError("prisma encountered a validation error", { cause })

export const prismaError = (cause: unknown) =>
  new PrismaError("prisma has thrown an error", { cause })

export const getVenueById =
  <Include extends Prisma.VenueInclude>(include: Include) =>
  (id: number) =>
    TE.tryCatch(
      () =>
        db.venue.findUniqueOrThrow({
          where: { id },
          include,
        }),
      prismaNotFound
    )

type PrismaClientDelegates = {
  [K in keyof PrismaClient]: K extends `\$${string}` ? never : K
}[keyof PrismaClient]

type PrismaDelegates = PrismaClient[PrismaClientDelegates]

export const delegate =
  <Delegate extends PrismaDelegates>(d: Delegate) =>
  <A extends unknown[], B>(f: (d: Delegate) => (...opts: A) => PrismaPromise<B>) =>
    TE.tryCatchK(f(d), prismaError)

export const getVenueByIdentifier =
  <Include extends Prisma.VenueInclude>(include?: Include) =>
  (identifier: string) =>
    TE.tryCatch(
      () =>
        db.venue.findUniqueOrThrow({
          where: { identifier },
          include,
        }),
      prismaNotFound
    )

export type QueryFilter<T> = (...args: any[]) => T
