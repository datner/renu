import { resolver } from "@blitzjs/rpc"
import { paginate } from "blitz"
import db, { GlobalRole, Prisma } from "db"

interface GetOrganizationsInput
  extends Pick<Prisma.OrganizationFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(GlobalRole.SUPER),
  async ({ where, orderBy, skip = 0, take = 100 }: GetOrganizationsInput) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const {
      items: organizations,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.organization.count({ where }),
      query: (paginateArgs) => db.organization.findMany({ ...paginateArgs, where, orderBy }),
    })

    return {
      organizations,
      nextPage,
      hasMore,
      count,
    }
  }
)
