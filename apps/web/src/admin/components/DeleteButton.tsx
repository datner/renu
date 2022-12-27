import { useRouter } from "next/router"
import { useMutation } from "@blitzjs/rpc"
import { Routes } from "@blitzjs/next"
import { useSpring, a } from "@react-spring/web"
import { useState } from "react"
import useMeasure from "react-use-measure"
import removeItem from "src/items/mutations/removeItem"
import { toast } from "react-toastify"
import { usePrevious } from "src/core/hooks/usePrevious"

type Props = {
  identifier: string
  onRemove(): void
}

export function DeleteButton(props: Props) {
  const { identifier, onRemove: onDelete } = props
  const router = useRouter()
  const [removeItemMutation, { isLoading, isIdle, isSuccess }] = useMutation(removeItem)
  const [ref, { width }] = useMeasure()
  const isNoWidth = usePrevious(width) === 0
  const { w } = useSpring({ w: width + 32, immediate: isNoWidth })
  const { angle } = useSpring({ angle: 0, config: { duration: 3000 } })
  const [isConsideringDeletion, setConsideration] = useState(false)

  const handleClick = async () => {
    if (angle.isAnimating) {
      onDelete()
      toast.promise(
        removeItemMutation({ identifier }),
        {
          pending: "Deleting in progress...",
          success: `${identifier} deleted successfully`,
          error: `Oops! Couldn't delete ${identifier}`,
        },
        { onClose: () => router.push(Routes.AdminItemsNew()) }
      )
      return
    }
    setConsideration(true)
    angle.set(360)
    await angle.start(0)
    setConsideration(false)
  }
  return (
    <a.button
      type="button"
      className="px-4 py-2 inline-flex items-center overflow-hidden border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 active:bg-red-600 active:text-white"
      style={{ width: w }}
      disabled={!isIdle}
      onClick={handleClick}
    >
      <div ref={ref} className="inline-flex flex-nowrap whitespace-nowrap gap-2 items-center">
        {isLoading || isSuccess ? (
          <span>deleting...</span>
        ) : (
          <>
            <span>{isConsideringDeletion ? "Are you sure?" : "Delete"}</span>
            {isConsideringDeletion && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                version="1.1"
                viewBox="0 0 300 300"
                preserveAspectRatio="none"
                className="h-5 w-5 top-0 text-red-600/50 -rotate-90 right-0"
              >
                <a.circle
                  cx="150"
                  cy="150"
                  r="57"
                  fill="none"
                  className="stroke-current"
                  strokeWidth="110"
                  strokeDasharray={angle.to((it) => `${it},20000`)}
                />
              </svg>
            )}
          </>
        )}
      </div>
    </a.button>
  )
}
