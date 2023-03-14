import { useRouter } from "next/router"
import { Routes } from "@blitzjs/next"
import { invalidateQuery, invoke, setQueryData, useQuery } from "@blitzjs/rpc"
import createItem from "../mutations/createItem"
import updateItem from "../mutations/updateItem"
import getItem from "../queries/getItem"
import getItems from "../queries/getItems"
import { ItemSchema } from "../validations"
import { pipe } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"
import { none, some } from "fp-ts/Option"
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories"
import { useCallback } from "react"
import * as Renu from "src/core/effect/runtime"

const invalidateQueries = Effect.allPar([
  Effect.promise(() => invalidateQuery(getItems)),
  Effect.promise(() => invalidateQuery(getCurrentVenueCategories)),
])

const revalidate = Effect.sync(() => navigator.sendBeacon("/api/revalidate-current"))

const useCreate = (redirect = false) => {
  const router = useRouter()

  const onSubmit = useCallback(
    (data: ItemSchema) =>
      pipe(
        Effect.promise(() => invoke(createItem, data)),
        Effect.tap(() => revalidate),
        Effect.tap((item) =>
          Effect.sync(() => setQueryData(getItem, { identifier: item.identifier }, item))
        ),
        Effect.tap(() => invalidateQueries),
        Effect.tap(({ identifier }) =>
          Effect.ifEffect(
            Effect.succeed(redirect),
            Effect.sync(() => router.push(Routes.AdminItemsItem({ identifier }))),
            Effect.unit()
          )
        ),
        Renu.runPromise$
      ),
    [redirect, router]
  )

  return { onSubmit, item: none }
}

const useUpdate = (identifier: string) => {
  const router = useRouter()
  const [item, { setQueryData }] = useQuery(getItem, { identifier })

  const onSubmit = (data: ItemSchema) =>
    pipe(
      Effect.sync(() => setQueryData(item)),
      Effect.flatMap(() => Effect.promise(() => invoke(updateItem, { id: item.id, ...data }))),
      Effect.tap((item) => Effect.sync(() => setQueryData(item))),
      Effect.tap(() => Effect.sync(() => navigator.sendBeacon("/api/revalidate-current"))),
      Effect.tap(() => invalidateQueries),
      Effect.tap((item) =>
        Effect.ifEffect(
          Effect.succeed(item.identifier === identifier),
          Effect.unit(),
          Effect.sync(() => router.push(Routes.AdminItemsItem({ identifier: item.identifier })))
        )
      ),
      Renu.runPromise$
    )

  return { onSubmit, item: some(item) }
}

export const item = {
  useCreate,
  useUpdate,
}
