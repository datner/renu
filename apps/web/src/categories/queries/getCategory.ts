import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import { IdOrSlug } from "src/core/helpers/zod"
import { NotFoundError } from "blitz"
import db from "db"

export default resolver.pipe(
  resolver.authorize(),
  resolver.zod(IdOrSlug),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  async (input) => {
    const category = await db.category.findFirst({
      where: input,
      include: { content: true },
    })

    if (!category) throw new NotFoundError()

    return category
  }
)
