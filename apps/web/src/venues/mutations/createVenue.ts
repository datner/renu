import { resolver } from "@blitzjs/rpc"
import { GlobalRole, Locale, MembershipRole } from "@prisma/client"
import { CreateVenueSchema } from "../validations"
import db from "db"

export default resolver.pipe(
  resolver.zod(CreateVenueSchema),
  resolver.authorize(GlobalRole.SUPER),
  async ({ memberId, en, he, organizationId, ...input }) => {
    return db.venue.create({
      data: {
        ...input,
        organizationId,
        content: {
          createMany: {
            data: [
              { locale: Locale.en, ...en },
              { locale: Locale.he, ...he },
            ],
          },
        },
        Affiliation: {
          create: {
            role: MembershipRole.OWNER,
            memberId,
            organizationId,
          },
        },
      },
    })
  }
)
