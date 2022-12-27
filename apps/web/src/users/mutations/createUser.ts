import { SecurePassword } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import { GlobalRole } from "@prisma/client"
import { CreateClientSchema } from "../validations"
import db from "db"

export default resolver.pipe(
  resolver.zod(CreateClientSchema),
  resolver.authorize(GlobalRole.SUPER),
  async ({ password, email }) => {
    const hashedPassword = await SecurePassword.hash(password.trim())
    return db.user.create({
      data: { email: email.toLowerCase().trim(), hashedPassword, role: GlobalRole.USER },
    })
  }
)
