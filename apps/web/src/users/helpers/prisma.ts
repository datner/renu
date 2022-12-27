import { delegate } from "src/core/helpers/prisma"
import db from "db"

export const userDelegate = delegate(db.user)
export const findFirstUser = userDelegate((u) => u.findFirstOrThrow)
export const updateUser = userDelegate((u) => u.update)
