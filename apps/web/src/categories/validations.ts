import { Locale } from "@prisma/client"
import { Slug } from "src/auth/validations"
import { z } from "zod"

export const Content = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
})

export const CategorySchema = z.object({
  identifier: Slug,
  en: Content.transform((it) => ({ ...it, locale: Locale.en })),
  he: Content.transform((it) => ({ ...it, locale: Locale.he })),
})

export const UpdateCategory = CategorySchema

export const CreateCategory = CategorySchema.transform(({ en, he, identifier }) => ({
  identifier,
  content: { createMany: { data: [en, he] } },
}))

export type UpdateCategory = z.input<typeof UpdateCategory>
export type CreateCategory = z.input<typeof CreateCategory>
export type CategorySchema = z.input<typeof CategorySchema>
