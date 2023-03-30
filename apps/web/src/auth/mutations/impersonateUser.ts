import { resolver } from "@blitzjs/rpc";
import { NotFoundError } from "blitz";
import db, { GlobalRole } from "db";
import { isNonEmpty } from "fp-ts/Array";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
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
    if (!isNonEmpty(user.membership)) {
      throw new NotFoundError(`${email} is not associated with any organizations`);
    }

    await pipe(
      getMembership(user),
      E.map((m) =>
        ctx.session.$create({
          userId: user.id,
          organization: m.organization,
          venue: m.affiliation.Venue,
          roles: [user.role, m.role],
          orgId: m.organizationId,
          impersonatingFromUserId: ctx.session.userId,
        })
      ),
      E.getOrElseW((e) => {
        throw e;
      }),
    );

    return user;
  },
);
