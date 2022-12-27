import { SecurePassword } from "@blitzjs/auth"
import { taskify } from "src/core/helpers/task"

export const verifyPassword = taskify(SecurePassword.verify)
export const hashPassword = taskify(SecurePassword.hash)
