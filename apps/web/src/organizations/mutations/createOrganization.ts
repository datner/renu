import { resolver } from "@blitzjs/rpc"
import db, { GlobalRole, MembershipRole } from "db"
import { CreateOrganizationSchema } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateOrganizationSchema),
  resolver.authorize(GlobalRole.SUPER),
  ({ userId, ...input }) =>
    db.organization.create({
      data: {
        ...input,
        memberships: {
          create: {
            role: MembershipRole.OWNER,
            userId,
          },
        },
      },
      include: {
        memberships: true,
      },
    })
)
