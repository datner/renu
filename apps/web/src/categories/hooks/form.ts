import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import createCategory from "../mutations/createCategory";
import getCategory from "../queries/getCategory";
import getCurrentVenueCategories from "../queries/getCurrentVenueCategories";
import { CreateCategory } from "../validations";

export const category = {
  useCreate: () => {
    const [create] = useMutation(createCategory);
    return {
      onSubmit: (data: CreateCategory) =>
        pipe(
          Effect.promise(() => create(data)),
          Effect.tap((c) =>
            Effect.allPar(
              Effect.sync(() => setQueryData(getCategory, { identifier: c.identifier }, c)),
              Effect.sync(() => setQueryData(getCategory, { id: c.id }, c)),
              Effect.sync(() => invalidateQuery(getCurrentVenueCategories)),
              Effect.sync(() => navigator.sendBeacon("/api/revalidate-current")),
            )
          ),
          Effect.runPromise,
        ),
    };
  },
};
