import { resolver } from "@blitzjs/rpc"
import { authenticateUser } from "./login"
import { ChangePassword } from "../validations"
import { NotFoundError } from "blitz"
import { constTrue, pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { hashPassword } from "../helpers/fp/securePassword"
import { updateUser } from "src/users/helpers/prisma"

export default resolver.pipe(
  resolver.zod(ChangePassword),
  resolver.authorize(),
  ({ currentPassword, newPassword }, ctx) =>
    pipe(
      authenticateUser(currentPassword)({ where: { id: ctx.session.userId }, include: {} }),
      TE.chainFirstW((user) =>
        pipe(
          hashPassword(newPassword),
          TE.fromTask,
          TE.chain((hashedPassword) =>
            updateUser({ where: { id: user.id }, data: { hashedPassword } })
          )
        )
      ),
      TE.match((e) => {
        if (e.tag === "AuthenticationError") {
          throw new NotFoundError()
        }
        return false
      }, constTrue)
    )()
)
