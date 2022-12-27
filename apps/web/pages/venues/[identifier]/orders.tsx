import { BlitzPage, useAuthenticatedSession } from "@blitzjs/auth"
import { useQuery } from "@blitzjs/rpc"
import { Routes } from "@blitzjs/next"
import { Order, OrderState, Prisma } from "@prisma/client"
import getVenueOrders from "src/venues/queries/current/getVenueOrders"
import { Suspense } from "react"

const Orders = () => {
  const session = useAuthenticatedSession()
  const [orders] = useQuery(getVenueOrders, {
    where: { state: OrderState.PaidFor },
    orderBy: { updatedAt: Prisma.SortOrder.desc },
  })
  return <div className="flex flex-col gap-4"></div>
}

const VenuesVenuOrders: BlitzPage = () => (
  <Suspense fallback={<div>loading...</div>}>
    <Orders />
  </Suspense>
)

VenuesVenuOrders.authenticate = { redirectTo: Routes.Authentication() }

export default VenuesVenuOrders
