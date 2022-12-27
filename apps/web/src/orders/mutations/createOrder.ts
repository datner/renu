import { resolver } from "@blitzjs/rpc"
import { Id } from "src/core/helpers/zod"
import db from "db"
import { z } from "zod"

const OrderItem = z.object({
  itemId: Id,
  price: z.number().int().multipleOf(50),
  quantity: z.number().int(),
  comment: z.string().default(""),
  name: z.string().min(1),
})

const CreateOrderInput = z
  .object({
    venueId: Id,
    items: OrderItem.array().transform((data) => ({ createMany: { data } })),
  })
  .transform((data) => ({ data }))

export default resolver.pipe(resolver.zod(CreateOrderInput), db.order.create)
