import { resolver } from "@blitzjs/rpc"
import { Slug } from "src/auth/validations"
import db from "db"
import { z } from "zod"

const GetMenu = z.object({
  slug: Slug,
})

export default resolver.pipe(resolver.zod(GetMenu), ({ slug }) =>
  db.venue.findUniqueOrThrow({
    where: { identifier: slug },
    include: {
      content: true,
      categories: {
        include: {
          content: true,
          items: {
            include: {
              content: true,
            },
          },
        },
      },
    },
  })
)
