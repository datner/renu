import { Locale } from "@prisma/client"
import { pipe } from "fp-ts/function"
import * as A from "fp-ts/Array"
import * as N from "fp-ts/number"
import * as Eq from "fp-ts/Eq"
import { atom, PrimitiveAtom } from "jotai"
import { atomFamily, splitAtom } from "jotai/utils"
import { ModifierConfig, ModifierEnum } from "db/itemModifierConfig"

export type OrderItemItem = {
  id: number
  image: string
  price: number
  identifier: string
  blurDataUrl: string | null
  categoryId: number
  content: { locale: Locale; name: string; description: string }[]
  modifiers: { id: number; position: number; config: ModifierConfig }[]
}
export interface OrderItem {
  amount: number
  comment: string
  modifiers: ModifierItem[]
  item: OrderItemItem
}

export interface ModifierItem {
  identifier: string
  _tag: ModifierEnum
  choice: string
  amount: number
  price: number
  id: number
}

const sum = A.reduce(0, N.SemigroupSum.concat)

const eqItem = Eq.contramap<number, OrderItemItem>((it) => it.id)(N.Eq)

export const orderAtom = atom<OrderItem["item"][]>([])
export const orderItemsAtom = atom((get) =>
  pipe(
    get(orderAtom),
    A.map((it) => get(orderAtomFamily(it)))
  )
)

export const orderAtomFamily = atomFamily<OrderItem["item"], PrimitiveAtom<OrderItem>>(
  (item) => atom({ comment: "", amount: 0, item, modifiers: [] as ModifierItem[] }),
  eqItem.equals
)

export type OrderFamilyAtom = PrimitiveAtom<OrderItem>

export const orderAtomsAtom = splitAtom(orderAtom)

export const priceAtom = atom((get) => {
  const order = get(orderItemsAtom)
  return pipe(
    order,
    A.foldMap(N.MonoidSum)(
      (it) =>
        it.amount * it.item.price +
        pipe(
          it.modifiers,
          A.foldMap(N.MonoidSum)((m) => m.price * m.amount)
        )
    )
  )
})

export const amountAtom = atom((get) =>
  pipe(
    get(orderItemsAtom),
    A.map((it) => it.amount),
    sum
  )
)
