import * as S from "@effect/schema/Schema";
import { Common } from "shared/schema";

export const CreateCategory = S.struct({
  identifier: Common.Slug,
  en: Common.Content,
  he: Common.Content,
});

export const CreateCategoryResult = S.struct({
  identifier: Common.Slug,
  content: S.struct({ createMany: S.struct({ data: S.array(Common.Content) }) }),
});

export const UpdateCategory = CreateCategory;
export interface CategoryForm extends S.From<typeof CreateCategory> {}
export interface UpdateCategory extends S.To<typeof UpdateCategory> {}
export interface CreateCategory extends S.To<typeof CreateCategory> {}
export interface CategorySchema extends S.To<typeof CreateCategory> {}
