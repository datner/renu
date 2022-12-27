import { resolver } from "@blitzjs/rpc"
import { Id } from "src/core/helpers/zod"
import { NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const AffiliateRestaurant = z.object({
  restaurantId: Id,
})

export default resolver.pipe(
  resolver.zod(AffiliateRestaurant),
  resolver.authorize(),
  async ({ restaurantId }, ctx) => {
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) throw new NotFoundError(`Could not find restaurant with id ${restaurantId}`)

    await db.user.update({ where: { id: ctx.session.userId }, data: { restaurantId } })

    await ctx.session.$setPublicData({
      restaurantId,
    })

    return restaurant
  }
)
