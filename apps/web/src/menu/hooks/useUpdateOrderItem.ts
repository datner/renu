import { PrimitiveAtom } from "jotai"
import { SetStateAction } from "react"
import { useAtomCallback } from "jotai/utils"
import { append, filter } from "fp-ts/Array"
import { orderAtom, OrderItem } from "src/menu/jotai/order"

export function useUpdateOrderItem(atom: PrimitiveAtom<OrderItem>) {
  return useAtomCallback<void, SetStateAction<OrderItem>>((get, set, update) => {
    const prev = get(atom)
    const next = typeof update === "function" ? update(prev) : update
    if (prev.amount === 0 && next.amount > 0) {
      set(orderAtom, append(prev.item))
    }
    if (prev.amount > 0 && next.amount === 0) {
      set(
        orderAtom,
        filter((it) => it.id !== prev.item.id)
      )
    }
    set(atom, next)
  })
}
