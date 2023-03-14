import { Common } from "src/core/schema"
import * as S from "@effect/schema/Schema"
import { pipe } from "@effect/data/Function"
import { z } from "zod"

export const Content = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
})

const _CategoryContent = pipe(Common.Content, S.omit("locale"))

export const CreateCategory = S.struct({
  identifier: Common.Slug,
  en: _CategoryContent,
  he: _CategoryContent,
})

export const CreateCategoryResult = S.struct({
  identifier: Common.Slug,
  content: S.struct({ createMany: S.struct({ data: S.array(Common.Content) }) }),
})

export interface CategoryForm {
  identifier: string
  en: { name: string; description?: string }
  he: { name: string; description?: string }
}

export const UpdateCategory = CreateCategory
export interface UpdateCategory extends S.Infer<typeof UpdateCategory> {}
export interface CreateCategory extends S.Infer<typeof CreateCategory> {}
export interface CategorySchema extends S.Infer<typeof CreateCategory> {}
