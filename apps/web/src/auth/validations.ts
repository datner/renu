import { z } from "zod"

export const email = z.string().trim().email()

export const password = z
  .string()
  .trim()
  .min(10, { message: "Password has to be at least 10 characters" })
  .max(100)

export const Signup = z.object({
  email,
  password,
})

export const Login = z.object({
  email,
  password: z.string().min(1),
})

export type Login = z.infer<typeof Login>

export const ForgotPassword = z.object({
  email,
})

export const ResetPassword = z
  .object({
    password: password,
    passwordConfirmation: password,
    token: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ["passwordConfirmation"], // set the path of the error
  })

export const ChangePassword = z.object({
  currentPassword: z.string(),
  newPassword: password,
})

const RestaurantContent = z.object({
  name: z
    .string()
    .min(1)
    .transform((str) => str.trim()),
})

export const Slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug should contain only lowercase letters, numbers, and dashes",
  })
  .regex(/[^-]$/, {
    message: "Slug should not end with a dash",
  })

export const CreateRestaurant = z.object({
  slug: Slug,
  logo: z.string().min(1),
  en: RestaurantContent,
  he: RestaurantContent,
})

export const _GenerateToken = z.object({
  email,
  organization: Slug,
})
