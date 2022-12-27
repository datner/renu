import { generateToken, hash256, SecurePassword } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import { GlobalRole, MembershipRole } from "@prisma/client"
import { nanoid } from "nanoid"
import { InviteMemberSchema } from "../validations"
import { addHours } from "date-fns/fp"
import { pipe } from "fp-ts/function"
import db from "db"

const RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS = 4
const getExpiresAt = () => pipe(new Date(), addHours(RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS))

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
    })
)
