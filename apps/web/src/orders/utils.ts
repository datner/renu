import { pipe } from "fp-ts/function"
import * as N from "fp-ts/number"
import * as A from "fp-ts/Array"
import * as R from "fp-ts/ReadonlyArray"
import * as L from "monocle-ts/Lens"
import * as T from "monocle-ts/Traversal"
import { Order, OrderItem } from "@prisma/client"

export namespace OrderUtils {
  export const items = pipe(
    L.id<Order & { items: OrderItem[] }>(),
    L.prop("items"),
    L.traverse(A.Traversable)
  )

  export const total = (o: Order & { items: OrderItem[] }) =>
    pipe(
      T.getAll(o)(items),
      R.foldMap(N.MonoidSum)((it) => it.price * it.quantity)
    )
}
