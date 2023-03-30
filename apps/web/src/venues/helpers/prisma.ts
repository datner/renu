import db from "db";
import { delegate } from "src/core/helpers/prisma";

export const venueDelegate = delegate(db.venue);
export const venueFindMany = venueDelegate((v) => v.findMany);
export const venueFindFirst = venueDelegate((v) => v.findFirstOrThrow);
