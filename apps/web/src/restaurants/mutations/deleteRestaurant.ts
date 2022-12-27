import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const DeleteRestaurant = z.object({
  id: z.number(),
})

export default resolver.pipe(
  resolver.zod(DeleteRestaurant),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const restaurant = await db.restaurant.deleteMany({ where: { id } })

    return restaurant
  }
)
