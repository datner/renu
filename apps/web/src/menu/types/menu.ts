import type { Category, CategoryI18L } from "db"

export type Category__Content = Category & {
  content: CategoryI18L[]
}
