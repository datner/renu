import { delegate } from "src/core/helpers/prisma"
import db from "db"

export const venueDelegate = delegate(db.venue)
export const venueFindMany = venueDelegate((v) => v.findMany)
export const venueFindFirst = venueDelegate((v) => v.findFirstOrThrow)
