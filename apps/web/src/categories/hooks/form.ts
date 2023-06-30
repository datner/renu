import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import createCategory from "../mutations/createCategory";
import getCategory from "../queries/getCategory";
import getCurrentVenueCategories from "../queries/getCurrentVenueCategories";
import { CategoryForm } from "../validations";

export const category = {
  useCreate: () => {
    const [create] = useMutation(createCategory);
    return {
      onSubmit: (data: CategoryForm) =>
        pipe(
          Effect.promise(() => create(data)),
          Effect.tap((c) =>
            Effect.allParDiscard(
              Effect.promise(() => setQueryData(getCategory, { identifier: c.identifier }, c)),
              Effect.promise(() => setQueryData(getCategory, { id: c.id }, c)),
              Effect.promise(() => invalidateQuery(getCurrentVenueCategories)),
              Effect.promise(() => fetch("/api/revalidate-current")),
            )
          ),
          Effect.runPromise,
        ),
    };
  },
};
