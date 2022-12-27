import { prismaNotFound } from "src/core/helpers/prisma"
import db, { Prisma } from "db"
import { tryCatch } from "fp-ts/TaskEither"

export const getOrder =
  (id: number) =>
  <Include extends Prisma.OrderInclude>(include: Include) =>
    tryCatch(() => db.order.findUniqueOrThrow({ where: { id }, include }), prismaNotFound)
