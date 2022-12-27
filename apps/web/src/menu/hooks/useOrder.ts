import { useEvent } from "src/core/hooks/useEvent"
import { useRef, useState } from "react"
import type { FullOrderItem, Item__Content, OrderMeta } from "../types/item"

export function useOrder() {
  const itemsRef = useRef<Map<Item__Content, OrderMeta>>(new Map())
  const overalls = useRef({
    amount: 0,
    price: 0,
  })
  const [orderItems, setItems] = useState<FullOrderItem[]>([])

  const changeOrder = useEvent((item: Item__Content, meta: OrderMeta) => {
    meta.amount === 0 ? itemsRef.current.delete(item) : itemsRef.current.set(item, meta)

    const itemTuples = Array.from(itemsRef.current.entries())
    overalls.current.amount = itemTuples.reduce((sum, [, { amount }]) => sum + amount, 0)
    overalls.current.price = itemTuples.reduce(
      (sum, [item, { amount }]) => sum + item.price * amount,
      0
    )
    setItems(
      itemTuples.map(([item, meta]) => ({
        ...meta,
        item,
      }))
    )
  })

  return {
    change: changeOrder,
    items: orderItems,
    get: (key: Item__Content) => itemsRef.current.get(key),
    ...overalls.current,
  }
}
