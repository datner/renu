import { pipe } from "@effect/data/Function"
import * as S from "@effect/schema/Schema"
import { Locale } from "database"

export const Slug = pipe(
  S.string,
  S.minLength(1),
  S.pattern(/^[a-z0-9-]+$/, {
    message: (slug) => `${slug} should contain only lowercase letters, numbers, and dashes`,
  }),
  S.pattern(/[^-]$/, {
    message: (slug) => `${slug} should not end with a dash`,
  }),
  S.brand("Slug")
)
export type Slug = S.Infer<typeof Slug>

export const Id = <B extends string>(brand: B) =>
  pipe(S.number, S.int(), S.positive(), S.brand(brand))

export const Content = S.struct({
  locale: S.enums(Locale),
  name: pipe(S.string, S.nonEmpty(), S.maxLength(50), S.trim),
  description: pipe(S.string, S.trim, S.maxLength(180), S.optional),
})
export interface Content extends S.Infer<typeof Content> {}
