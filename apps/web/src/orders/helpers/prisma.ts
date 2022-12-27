import { delegate } from "src/core/helpers/prisma"
import db from "db"

export const orderDelegate = delegate(db.order)
export const findFirstOrder = orderDelegate((o) => o.findFirstOrThrow)
export const findUniqueOrder = orderDelegate((o) => o.findUniqueOrThrow)
export const updateOrder = orderDelegate((o) => o.update)
