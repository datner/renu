import { resolver } from "@blitzjs/rpc";
import { GlobalRole, Locale, MembershipRole } from "database";
import db from "db";
import { CreateVenueSchema } from "../validations";

export default resolver.pipe(
  resolver.zod(CreateVenueSchema),
  resolver.authorize(GlobalRole.SUPER),
  async ({ memberId, en, he, organizationId, ...input }) => {
    return db.venue.create({
      data: {
        ...input,
        organizationId,
        content: {
          createMany: {
            data: [
              { locale: Locale.en, ...en },
              { locale: Locale.he, ...he },
            ],
          },
        },
        Affiliation: {
          create: {
            role: MembershipRole.OWNER,
            memberId,
            organizationId,
          },
        },
      },
    });
  },
);
