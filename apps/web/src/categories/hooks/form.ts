import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc"
import getCurrentVenueCategories from "../queries/getCurrentVenueCategories"
import createCategory from "../mutations/createCategory"
import getCategory from "../queries/getCategory"
import { CategorySchema } from "../validations"
import { pipe } from "fp-ts/function"
import * as RT from "fp-ts/ReaderTask"

const useCategoryMutation = () => useMutation(createCategory)

export const category = {
  useCreate: () => {
    const [create] = useCategoryMutation()
    return {
      onSubmit: pipe(
        RT.ask<CategorySchema>(),
        RT.chainTaskK((data) => () => create(data)),
        RT.chainFirstTaskK((c) => () => setQueryData(getCategory, { identifier: c.identifier }, c)),
        RT.chainFirstTaskK(() => () => invalidateQuery(getCurrentVenueCategories)),
        RT.chainFirstTaskK(() => () => fetch("/api/revalidate-current"))
      ),
    }
  },
}
