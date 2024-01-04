import * as S from "@effect/schema/Schema";
import { Common } from "shared/schema";

const ContentField = S.struct({
  name: Common.Name,
});

export const CreateCategory = S.struct({
  identifier: Common.Slug,
  en: S.attachPropertySignature("locale", "en")(ContentField),
  he: S.attachPropertySignature("locale", "he")(ContentField),
});

const CategoryForm = S.struct({
  identifier: Common.Slug,
  en: ContentField,
  he: ContentField,
});

export const CreateCategoryResult = S.struct({
  identifier: Common.Slug,
  content: S.struct({ createMany: S.struct({ data: S.array(Common.Content) }) }),
});

export const UpdateCategory = CreateCategory;
export interface CategoryForm extends S.Schema.From<typeof CreateCategory> {}
export interface UpdateCategory extends S.Schema.To<typeof UpdateCategory> {}
export interface CreateCategory extends S.Schema.To<typeof CreateCategory> {}
export interface CategorySchema extends S.Schema.To<typeof CreateCategory> {}
