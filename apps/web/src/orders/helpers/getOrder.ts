import db, { Prisma } from "db";
import { tryCatch } from "fp-ts/TaskEither";
import { prismaNotFound } from "src/core/helpers/prisma";

export const getOrder = (id: number) => <Include extends Prisma.OrderInclude>(include: Include) =>
  tryCatch(() => db.order.findUniqueOrThrow({ where: { id }, include }), prismaNotFound);
