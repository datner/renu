import { resolver } from "@blitzjs/rpc"
import { paginate } from "blitz"
import db, { GlobalRole, Prisma } from "db"

interface GetOrganizationsInput
  extends Pick<Prisma.UserFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(GlobalRole.SUPER),
  async ({ where, orderBy, skip = 0, take = 100 }: GetOrganizationsInput) => {
    const {
      items: users,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.user.count(),
      query: (paginateArgs) =>
        db.user.findMany({
          ...paginateArgs,
          where,
          orderBy,
          include: {
            membership: {
              include: {
                organization: true,
                affiliations: {
                  include: {
                    Venue: true,
                  },
                },
              },
            },
          },
        }),
    })

    return {
      users,
      nextPage,
      hasMore,
      count,
    }
  }
)
