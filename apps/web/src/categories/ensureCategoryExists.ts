import { SessionContext } from "@blitzjs/auth"
import db from "db"
import { ExistsQueryResponse, OwnershipValidator } from "src/auth/helpers/validateOwnership"
import { NotFoundError } from "blitz"

export async function isCategoryExists(id: number | undefined, session: SessionContext) {
  const [{ exists }] =
    (await db.$queryRaw`SELECT EXISTS(SELECT 1 FROM "Category" WHERE "restaurantId" = ${session.restaurantId} AND id = ${id})`) as ExistsQueryResponse

  return exists
}

export const ensureCategoryExists: OwnershipValidator = async (id, session) => {
  if (!(await isCategoryExists(id, session))) {
    throw new NotFoundError(
      `Could not find category ${id} belonging to restaurant ${session.restaurantId}`
    )
  }
}
