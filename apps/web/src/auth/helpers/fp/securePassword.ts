import { SecurePassword } from "@blitzjs/auth/secure-password";
import { taskify } from "src/core/helpers/task";

export const verifyPassword = taskify(SecurePassword.verify);
export const hashPassword = taskify(SecurePassword.hash);
