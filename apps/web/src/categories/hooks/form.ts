import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc";
import { Effect } from "effect";
import createCategory from "../mutations/createCategory";
import getCategory from "../queries/getCategory";
import getCurrentVenueCategories from "../queries/getCurrentVenueCategories";
import { CategoryForm } from "../validations";

export const category = {
  useCreate: () => {
    const [create] = useMutation(createCategory);
    return {
      onSubmit: (data: CategoryForm) =>
        Effect.promise(() => create(data)).pipe(
          Effect.tap((c) =>
            Effect.all([
              Effect.promise(() => setQueryData(getCategory, { identifier: c.identifier }, c)),
              Effect.promise(() => setQueryData(getCategory, { id: c.id }, c)),
              Effect.promise(() => invalidateQuery(getCurrentVenueCategories)),
              Effect.promise(() => fetch("/api/revalidate-current")),
            ], { concurrency: "unbounded", discard: true })
          ),
          Effect.runPromise,
        ),
    };
  },
};
