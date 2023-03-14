import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc"
import getCurrentVenueCategories from "../queries/getCurrentVenueCategories"
import createCategory from "../mutations/createCategory"
import getCategory from "../queries/getCategory"
import { CreateCategory } from "../validations"
import { pipe } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"

export const category = {
  useCreate: () => {
    const [create] = useMutation(createCategory)
    return {
      onSubmit: (data: CreateCategory) =>
        pipe(
          Effect.promise(() => create(data)),
          Effect.tap((c) =>
            Effect.allPar(
              Effect.sync(() => setQueryData(getCategory, { identifier: c.identifier }, c)),
              Effect.sync(() => setQueryData(getCategory, { id: c.id }, c)),
              Effect.sync(() => invalidateQuery(getCurrentVenueCategories)),
              Effect.sync(() => navigator.sendBeacon("/api/revalidate-current"))
            )
          ),
          Effect.runPromise
        ),
    }
  },
}
