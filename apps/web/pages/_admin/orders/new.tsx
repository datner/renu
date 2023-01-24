import * as A from "fp-ts/Array"
import * as E from "fp-ts/Either"
import { useQuery } from "@blitzjs/rpc"
import getVenueOrders from "src/venues/queries/current/getVenueOrders"
import { pipe } from "fp-ts/lib/function"
import { Suspense } from "react"

function OrderList() {
  const [orders] = useQuery(getVenueOrders, {})

  return (
    <div className="px-4 space-y-2">
      {pipe(
        orders,
        E.match(
          (e) => [],
          (o) => o.orders
        ),
        A.reverse,
        A.match(
          () => [<div>darn</div>],
          A.map((order) => (
            <div className="border rounded">
              <div key={order.id} tabIndex={0} className="collapse">
                <div className="collapse-title text-xl font-medium">
                  {order.id} -- {order.state}
                </div>
                <div className="collapse-content">details come here</div>
              </div>
            </div>
          ))
        )
      )}
    </div>
  )
}

export function NewOrder() {
  return (
    <Suspense fallback={"wait...."}>
      <OrderList />
    </Suspense>
  )
}

export default NewOrder
