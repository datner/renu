import { Prisma } from "@prisma/client"

export type PrismaNotFoundError = {
  tag: "prismaNotFoundError"
  error: Prisma.NotFoundError
}

export type PrismaValidationError = {
  tag: "prismaValidationError"
  error: Prisma.PrismaClientValidationError
}
