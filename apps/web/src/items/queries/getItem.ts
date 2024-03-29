import { resolver } from "@blitzjs/rpc";
import { NotFoundError } from "blitz";
import db from "db";
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization";
import { ensureVenueRelatedToOrganization } from "src/auth/helpers/ensureVenueRelatedToOrganization";
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId";
import { setDefaultVenueId } from "src/auth/helpers/setDefaultVenueId";
import { IdOrSlug } from "src/core/helpers/zod";

// @deprecated
export default resolver.pipe(
  resolver.authorize(),
  resolver.zod(IdOrSlug),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenueId,
  ensureVenueRelatedToOrganization,
  async (input) => {
    const item = await db.item.findFirst({
      where: { ...input },
      include: { content: true, modifiers: { where: { deleted: null } } },
    });

    if (!item) throw new NotFoundError();

    return item;
  },
);
