import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const UpdateRestaurant = z.object({
  id: z.number(),
  name: z.string(),
})

export default resolver.pipe(
  resolver.zod(UpdateRestaurant),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const restaurant = await db.restaurant.update({ where: { id }, data })

    return restaurant
  }
)
