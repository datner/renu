import { resolver } from "@blitzjs/rpc"
import { Ctx, paginate } from "blitz"
import db, { Prisma } from "db"

interface GetCategoriesArgs
  extends Pick<Prisma.CategoryFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async (
    { where: _where, orderBy, skip = 0, take = 100 }: GetCategoriesArgs,
    { session: { restaurantId } }: Ctx
  ) => {
    const where = {
      restaurantId,
      deleted: null,
      ..._where,
    }

    const {
      items: categories,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.category.count({ where }),
      query: (paginateArgs) =>
        db.category.findMany({
          ...paginateArgs,
          include: {
            content: true,
            items: { where: { deleted: null }, include: { content: true } },
          },
          where,
          orderBy,
        }),
    })

    return {
      categories,
      nextPage,
      hasMore,
      count,
    }
  }
)
