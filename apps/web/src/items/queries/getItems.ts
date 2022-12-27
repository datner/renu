import { resolver } from "@blitzjs/rpc"
import { Ctx, paginate } from "blitz"
import db, { Prisma } from "db"

interface GetItemsArgs
  extends Pick<Prisma.ItemFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async (
    { where: _where, orderBy, skip = 0, take = 100 }: GetItemsArgs,
    { session: { restaurantId } }: Ctx
  ) => {
    const where = {
      restaurantId,
      deleted: null,
      ..._where,
    }

    const {
      items: items,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.item.count({ where }),
      query: (paginateArgs) =>
        db.item.findMany({ ...paginateArgs, include: { category: true }, where, orderBy }),
    })

    return {
      items,
      nextPage,
      hasMore,
      count,
    }
  }
)
