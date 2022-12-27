import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { ensureVenueRelatedToOrganization } from "src/auth/helpers/ensureVenueRelatedToOrganization"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenueId } from "src/auth/helpers/setDefaultVenueId"
import { paginate } from "blitz"
import db, { Prisma } from "db"

interface GetCategoriesArgs
  extends Pick<Prisma.CategoryFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  (input: GetCategoriesArgs) => input,
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenueId,
  ensureVenueRelatedToOrganization,
  async ({ where: _where, orderBy, skip = 0, take = 100, venueId, organizationId }) => {
    const where: Prisma.CategoryWhereInput = {
      venueId,
      organizationId,
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
            categoryItems: {
              orderBy: { position: Prisma.SortOrder.asc },
              where: {
                Item: { deleted: null },
              },
              include: {
                Item: {
                  include: {
                    content: true,
                  },
                },
              },
            },
            items: { where: { deleted: null }, include: { content: true } },
          },
          where,
          orderBy,
        }),
    })

    // temp
    for (const category of categories) {
      category.items = category.categoryItems.map((c) => c.Item)
    }

    return {
      categories,
      nextPage,
      hasMore,
      count,
    }
  }
)
