import { resolver } from "@blitzjs/rpc"
import affiliateRestaurant from "src/auth/mutations/affiliateRestaurant"
import { CreateRestaurant } from "src/auth/validations"
import db, { Locale } from "db"
import { z } from "zod"

export default resolver.pipe(
  resolver.zod(CreateRestaurant.extend({ affiliate: z.boolean().optional() })),
  resolver.authorize(),
  async ({ slug, en, he, logo, affiliate }, ctx) => {
    const restaurant = await db.restaurant.create({
      data: {
        slug,
        logo,
        content: {
          createMany: {
            data: [
              {
                ...en,
                locale: Locale.en,
              },
              {
                ...he,
                locale: Locale.he,
              },
            ],
          },
        },
      },
    })

    if (affiliate) await affiliateRestaurant({ restaurantId: restaurant.id }, ctx)

    return restaurant
  }
)
