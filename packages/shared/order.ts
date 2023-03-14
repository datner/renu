import * as Chunk from "@effect/data/Chunk"
import { pipe } from "@fp-ts/core/Function"
import { Order, OrderItem } from "database"

export const total = (o: Order & { items: OrderItem[] }) =>
  pipe(
    Chunk.fromIterable(o.items),
    Chunk.reduce(0, (s, it) => s + it.price * it.quantity)
  )
