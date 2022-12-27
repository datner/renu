import { Ctx } from "blitz"
import db from "db"

export async function getUserRestaurant(ctx: Ctx) {
  if (!ctx.session.restaurantId)
    throw new Error(`Could not find restaurant associated with user ID ${ctx.session.userId}`)
  const restaurant = await db.restaurant.findUnique({ where: { id: ctx.session.restaurantId } })
  if (!restaurant) throw new Error(`Could not find restaurant with ID ${ctx.session.restaurantId}`)

  return restaurant
}
