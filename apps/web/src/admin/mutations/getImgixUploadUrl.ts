import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { Slug } from "src/auth/validations"

export const UploadImgixImage = z.object({
  name: z.string().min(1),
  venue: Slug,
})

export default resolver.pipe(
  resolver.zod(UploadImgixImage),
  resolver.authorize(),
  async ({ name, venue }) => {
    return {
      url: `https://api.imgix.com/api/v1/sources/${process.env.IMGIX_SOURCE_ID}/upload/${venue}/${name}`,
      headers: {
        Authorization: `Bearer ${process.env.IMGIX_API_KEY}`,
      },
    }
  }
)
