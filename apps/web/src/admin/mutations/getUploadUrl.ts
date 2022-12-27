import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { Slug } from "src/auth/validations"
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue"

export const UploadImage = z.object({
  name: z.string().min(1),
  restaurant: Slug.optional(),
})

export default resolver.pipe(
  resolver.zod(UploadImage),
  resolver.authorize(),
  setDefaultVenue,
  async ({ name, restaurant, venue }) => {
    const slug = restaurant ?? venue.identifier

    return {
      url: `https://api.imgix.com/api/v1/sources/${process.env.IMGIX_SOURCE_ID}/upload/${slug}/${name}`,
      headers: {
        Authorization: `Bearer ${process.env.IMGIX_API_KEY}`,
      },
    }
  }
)
