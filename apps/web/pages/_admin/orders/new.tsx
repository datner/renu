import { Suspense } from "react"

function OrderList() {
  return <div className="px-4 space-y-2">go away</div>
}

export function NewOrder() {
  return (
    <Suspense fallback={"wait...."}>
      <OrderList />
    </Suspense>
  )
}

export default NewOrder
