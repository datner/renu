import { Ctx } from "blitz"
import { GlobalRole } from "db"
import { assert } from "./assert"

export const enforceSuperAdminIfNotCurrentOrganization = <T extends Record<any, any>>(
  input: T,
  ctx: Ctx
): T => {
  assert(ctx.session.organization, "missing session.organization")
  assert(input.organizationId, "missing input.organizationId")

  if (input.organizationId !== ctx.session.orgId) {
    ctx.session.$authorize(GlobalRole.SUPER)
  }

  return input
}
