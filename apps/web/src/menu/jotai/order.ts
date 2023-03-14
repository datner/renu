import { Locale } from "database"
import { pipe } from "fp-ts/function"
import * as A from "@fp-ts/core/ReadonlyArray"
import * as Data from "@effect/data/Data"
import * as Equal from "@effect/data/Equal"
import { atom, PrimitiveAtom } from "jotai"
import { atomFamily, splitAtom } from "jotai/utils"
import { ModifierConfig, ModifierEnum } from "db/itemModifierConfig"
import { symbol } from "@effect/data/Hash"

export interface OrderItemItem extends Data.Case {
  readonly _tag: "OrderItemItem"
  readonly id: number
  readonly image: string
  readonly price: number
  readonly identifier: string
  readonly blurDataUrl: string | null
  readonly categoryId: number
  readonly content: { locale: Locale; name: string; description: string }[]
  readonly modifiers: { id: number; position: number; config: ModifierConfig }[]
}
export const OrderItemItem = Data.tagged<OrderItemItem>("OrderItemItem")

export interface OrderItem extends Data.Case {
  readonly _tag: "OrderItem"
  readonly amount: number
  readonly comment: string
  readonly modifiers: Data.Data<ModifierItem[]>
  readonly item: OrderItemItem
}
export const OrderItem = Data.tagged<OrderItem>("OrderItem")

export interface ModifierItem extends Data.Case {
  readonly _tag: ModifierEnum
  readonly identifier: string
  readonly choice: string
  readonly amount: number
  readonly price: number
  readonly id: number
}
export const OneOf = Data.tagged<ModifierItem>("oneOf")
export const Extras = Data.tagged<ModifierItem>("extras")

export interface Order extends Data.Case {
  readonly _tag: "Order"
  readonly items: Data.Data<OrderItem[]>
}
export const Order = Data.tagged<Order>("Order")

export const orderItemsAtom = atom([] as OrderItem[])
export const orderItemAtomsAtom = splitAtom(orderItemsAtom, (o) => o[symbol])

export const orderAtomFamily = atomFamily<OrderItem["item"], PrimitiveAtom<OrderItem>>(
  (item) =>
    atom(OrderItem({ comment: "", amount: 0, item, modifiers: Data.array([] as ModifierItem[]) })),
  Equal.equals
)

export type OrderFamilyAtom = PrimitiveAtom<OrderItem>

export const priceAtom = atom((get) => {
  const order = get(orderItemsAtom)
  return pipe(
    order,
    A.reduce(
      0,
      (sum, it) =>
        it.amount * it.item.price +
        pipe(
          it.modifiers,
          A.reduce(0, (sum, m) => sum + m.price * m.amount)
        ) +
        sum
    )
  )
})

export const amountAtom = atom((get) =>
  pipe(
    get(orderItemsAtom),
    (atoms) => {
      console.log(atoms)
      return atoms
    },
    A.reduce(0, (sum, it) => sum + it.amount)
  )
)
