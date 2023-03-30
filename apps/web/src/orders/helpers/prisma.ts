import db from "db";
import { delegate } from "src/core/helpers/prisma";

export const orderDelegate = delegate(db.order);
export const findFirstOrder = orderDelegate((o) => o.findFirstOrThrow);
export const findUniqueOrder = orderDelegate((o) => o.findUniqueOrThrow);
export const updateOrder = orderDelegate((o) => o.update);
