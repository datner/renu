import { SessionContext } from "@blitzjs/auth"
import db from "db"
import { ExistsQueryResponse, OwnershipValidator } from "src/auth/helpers/validateOwnership"
import { NotFoundError } from "blitz"

async function isItemExists(id: number | undefined, session: SessionContext) {
  const [{ exists }] =
    (await db.$queryRaw`SELECT EXISTS(SELECT 1 FROM "Item" WHERE "restaurantId" = ${session.restaurantId} AND id = ${id})`) as ExistsQueryResponse

  return exists
}

export const ensureItemExists: OwnershipValidator = async (id, session) => {
  if (!(await isItemExists(id, session))) {
    throw new NotFoundError(
      `Could not find item ${id} belonging to restaurant ${session.restaurantId}`
    )
  }
}
