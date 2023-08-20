import { resolver } from "@blitzjs/rpc";
import * as E from "@effect/data/Either";
import * as A from "@effect/data/ReadonlyArray";
import { NotFoundError } from "blitz";
import db, { GlobalRole } from "db";
import { z } from "zod";
import { getMembership } from "../helpers/getMembership";

export const ImpersonateUserInput = z.object({
  email: z.string().email(),
});

export default resolver.pipe(
  resolver.zod(ImpersonateUserInput),
  resolver.authorize(GlobalRole.SUPER),
  async ({ email }, ctx) => {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        membership: { include: { affiliations: { include: { Venue: true } }, organization: true } },
      },
    });
    if (!user) throw new NotFoundError(`Could not find user with email ${email}`);
    if (!A.isNonEmptyArray(user.membership)) {
      throw new NotFoundError(`${email} is not associated with any organizations`);
    }

    await getMembership(user).pipe(
      E.mapRight((m) =>
        ctx.session.$create({
          userId: user.id,
          organization: m.organization,
          venue: m.affiliation.Venue,
          roles: [user.role, m.role],
          orgId: m.organizationId,
          impersonatingFromUserId: ctx.session.userId,
        })
      ),
      E.getOrThrow,
    );

    return user;
  },
);
