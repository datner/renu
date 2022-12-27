import { useSearchParams } from "next/navigation"
import { useQuery, invoke } from "@blitzjs/rpc"
import { CheckIcon, EllipsisHorizontalIcon, XMarkIcon } from "@heroicons/react/24/solid"
import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import { Button, Textarea } from "@mantine/core"
import { useZodForm } from "src/core/hooks/useZodForm"
import { z } from "zod"
import sendComment from "src/menu/mutations/sendComment"
import validateStatus from "src/orders/queries/validateStatus"
import { Suspense } from "react"

export function SuccessPage() {
  const searchParams = useSearchParams()
  const [response] = useQuery(
    validateStatus,
    {
      orderId: searchParams.get("more_info"),
      txId: searchParams.get("transaction_uid"),
    },
    { retry: 35 }
  )

  const form = useZodForm({
    schema: z.object({ comment: z.string() }),
  })

  console.log(response)
  return pipe(
    response,
    E.match(
      () => (
        <div className="grow flex items-center place-self-center min-h-0">
          <div className="p-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <XMarkIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Error!</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {`Oops! We are very sorry, but something went wrong and your order didn't get through.
              Don't worry, we notified our team and will resolve this shortly! Please be patient

              with us while we're still in early beta`}
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      () => (
        <div className="grow flex items-center place-self-center min-h-0">
          <div className="p-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Order successful!</h3>
              <div className="py-2">
                <p className="text-sm text-gray-500">
                  Thank you for using Renu, we are still in very early rollout. We know you have
                  something to say about the service, please tell us here (we actually read it, we
                  get it straight to our phones!)
                </p>
              </div>
              {form.formState.isSubmitSuccessful ? (
                <div className="font-medium">Thank you so much!</div>
              ) : (
                <form
                  className="space-y-2"
                  onSubmit={form.handleSubmit((data) => invoke(sendComment, data))}
                >
                  <Textarea {...form.register("comment")} placeholder="I loved it! but..." />
                  <Button fullWidth loading={form.formState.isSubmitting} type="submit">
                    Submit
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )
    )
  )
}

export default function Success() {
  return (
    <Suspense
      fallback={
        <div className="grow flex place-content-center place-self-center min-h-0">
          <div className="p-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <EllipsisHorizontalIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Wait for it....</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {`We're just checking to see everything is fine and telling the kitchen to start cooking!`}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SuccessPage />
    </Suspense>
  )
}
