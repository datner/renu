import { generateToken, hash256 } from "@blitzjs/auth";
import { SecurePassword } from "@blitzjs/auth/secure-password";
import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import { GlobalRole, MembershipRole } from "database";
import { addHours } from "date-fns";
import db from "db";
import { nanoid } from "nanoid";
import { InviteMemberSchema } from "../validations";

const RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS = 4;
const getExpiresAt = () => addHours(new Date(), RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS);

export default resolver.pipe(
  resolver.zod(InviteMemberSchema),
  resolver.authorize(GlobalRole.SUPER),
  async (input) =>
    db.membership.create({
      data: {
        role: MembershipRole.ADMIN,
        organization: { connect: { identifier: input.organization } },
        user: {
          connectOrCreate: {
            create: {
              name: input.name,
              email: input.email.toLowerCase(),
              hashedPassword: await SecurePassword.hash(nanoid()),
              role: GlobalRole.USER,
              tokens: {
                create: {
                  expiresAt: getExpiresAt(),
                  sentTo: input.email.toLowerCase(),
                  type: "RESET_PASSWORD",
                  hashedToken: pipe(generateToken(), hash256),
                },
              },
            },
            where: { email: input.email },
          },
        },
        affiliations: input.venue
          ? {
            create: {
              role: MembershipRole.ADMIN,
              organization: {
                connect: {
                  identifier: input.organization,
                },
              },
              Venue: {
                connect: {
                  identifier: input.venue,
                },
              },
            },
          }
          : undefined,
      },
    }),
  (member) =>
    db.token.findFirst({
      where: { type: "RESET_PASSWORD", userId: member.userId!, expiresAt: { gte: new Date() } },
    }),
);
