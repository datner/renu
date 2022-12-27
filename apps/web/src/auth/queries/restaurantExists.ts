import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const Exists = z.object({
  id: z.number().int().positive(),
})

export default resolver.pipe(resolver.zod(Exists), async ({ id }) => {
  const restaurant = await db.restaurant.findUnique({ where: { id } })
  return Boolean(restaurant)
})
