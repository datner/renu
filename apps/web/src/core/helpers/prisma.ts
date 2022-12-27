import { Prisma, PrismaClient, PrismaPromise } from "@prisma/client"
import { PrismaNotFoundError, PrismaValidationError } from "src/core/type/prisma"
import db from "db"
import * as TE from "fp-ts/TaskEither"

export const prismaNotFound = (e: unknown): PrismaNotFoundError => ({
  tag: "prismaNotFoundError",
  error: e as Prisma.NotFoundError,
})

export const prismaNotValid = (e: unknown): PrismaValidationError => ({
  tag: "prismaValidationError",
  error: e as Prisma.PrismaClientValidationError,
})

type PrismaError = {
  tag: "PrismaError"
  error: unknown
}

export const prismaError = (error: unknown): PrismaError => ({
  tag: "PrismaError",
  error,
})

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
