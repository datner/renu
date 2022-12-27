import { resolver } from "@blitzjs/rpc"
import { paginate } from "blitz"
import db, { GlobalRole, Prisma } from "db"

interface GetVenuesInput
  extends Pick<Prisma.VenueFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(GlobalRole.SUPER),
  async ({ where, orderBy, skip = 0, take = 100 }: GetVenuesInput) => {
    const {
      items: venues,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.venue.count({ where }),
      query: (paginateArgs) => db.venue.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      venues,
      nextPage,
      hasMore,
      count,
    }
  }
)
