import { SecurePassword } from "@blitzjs/auth/secure-password";
import { resolver } from "@blitzjs/rpc";
import { GlobalRole } from "database";
import db from "db";
import { CreateClientSchema } from "../validations";

export default resolver.pipe(
  resolver.zod(CreateClientSchema),
  resolver.authorize(GlobalRole.SUPER),
  async ({ password, email }) => {
    const hashedPassword = await SecurePassword.hash(password.trim());
    return db.user.create({
      data: { email: email.toLowerCase().trim(), hashedPassword, role: GlobalRole.ADMIN },
    });
  },
);
