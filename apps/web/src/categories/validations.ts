import { Common } from "shared/schema"
import * as S from "@effect/schema/Schema"
import { z } from "zod"

export const Content = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
})

const _CategoryContent = S.struct({
  name: Common.Name,
  description: Common.Description,
})

export const CreateCategory = S.struct({
  identifier: Common.Slug,
  en: _CategoryContent,
  he: _CategoryContent,
})

export const CreateCategoryResult = S.struct({
  identifier: Common.Slug,
  content: S.struct({ createMany: S.struct({ data: S.array(Common.Content) }) }),
})

export const UpdateCategory = CreateCategory
export interface CategoryForm extends S.From<typeof CreateCategory> {}
export interface UpdateCategory extends S.To<typeof UpdateCategory> {}
export interface CreateCategory extends S.To<typeof CreateCategory> {}
export interface CategorySchema extends S.To<typeof CreateCategory> {}
