import { PrimitiveAtom, SetStateAction } from "jotai"
import { useCallback } from "react"
import { useAtomCallback } from "jotai/utils"
import { orderItemAtomsAtom, OrderItem } from "src/menu/jotai/order"

export function useUpdateOrderItem(atom: PrimitiveAtom<OrderItem>) {
  return useAtomCallback<void, [SetStateAction<OrderItem>]>(
    useCallback(
      (get, set, update) => {
        const prev = get(atom)
        const next = typeof update === "function" ? update(prev) : update
        if (prev.amount === 0 && next.amount > 0) {
          set(orderItemAtomsAtom, { type: "insert", value: next })
        }
        if (prev.amount > 0 && next.amount === 0) {
          set(orderItemAtomsAtom, { type: "remove", atom })
        }
        set(atom, next)
      },
      [atom]
    )
  )
}
