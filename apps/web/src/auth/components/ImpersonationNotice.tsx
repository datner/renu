import { useAuthenticatedSession } from "@blitzjs/auth"
import { Routes } from "@blitzjs/next"
import { invoke, getQueryClient } from "@blitzjs/rpc"
import { useRouter } from "next/router"
import stopImpersonating from "../mutations/stopImpersonating"

export const ImpersonationNotice = () => {
  const { impersonatingFromUserId, userId } = useAuthenticatedSession()
  const router = useRouter()
  if (!impersonatingFromUserId) return null

  return (
    <div className="bg-yellow-400 px-2 py-2 text-center font-semibold">
      <span>Currently impersonating user {userId}</span>
      <button
        className="appearance-none bg-transparent text-black uppercase ml-2"
        onClick={async () => {
          await invoke(stopImpersonating, null)
          getQueryClient().clear()
          router.push(Routes.Impersonate())
        }}
      >
        Exit
      </button>
    </div>
  )
}
