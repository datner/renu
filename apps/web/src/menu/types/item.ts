import type { Item, ItemI18L } from "db"

export interface OrderMeta {
  amount: number
  comment: string
}

export interface FullOrderItem extends OrderMeta {
  item: Item__Content
}

export type Item__Content = Item & {
  content: ItemI18L[]
}
