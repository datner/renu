import { Routes } from "@blitzjs/next";
import { invalidateQuery, invoke, setQueryData, useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { useRouter } from "next/router";
import { useCallback } from "react";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import createDbItem from "../mutations/createItem";
import updateItem from "../mutations/updateItem";
import getItem from "../queries/getItem";
import getItemNew, { FullItem } from "../queries/getItemNew";
import getItems from "../queries/getItems";
import { ItemForm } from "../validations";

const invalidateQueries = Effect.allPar([
  Effect.promise(() => invalidateQuery(getItems)),
  Effect.promise(() => invalidateQuery(getCurrentVenueCategories)),
]);

const revalidate = Effect.sync(() => navigator.sendBeacon("/api/revalidate-current"));

const useCreate = (redirect = false) => {
  const router = useRouter();

  const onSubmit = useCallback(
    (data: ItemForm) => {
      return pipe(
        Effect.promise(() => invoke(createDbItem, data)),
        Effect.tap(() => revalidate),
        Effect.tap((item) => Effect.sync(() => setQueryData(getItem, { identifier: item.identifier }, item))),
        Effect.tap(() => invalidateQueries),
        Effect.tap(({ identifier }) =>
          Effect.ifEffect(
            Effect.succeed(redirect),
            Effect.sync(() => router.push(Routes.AdminItemsItem({ identifier }))),
            Effect.unit(),
          )
        ),
        Effect.runPromise,
      );
    },
    [redirect, router],
  );

  return { onSubmit, item: O.none() };
};

const useUpdate = (identifier: string) => {
  const router = useRouter();
  const [item, { setQueryData }] = useQuery(getItemNew, identifier, { select: Schema.decode(FullItem) });

  const onSubmit = (data: ItemForm) =>
    pipe(
      Effect.sync(() => setQueryData(item)),
      Effect.flatMap(() => Effect.promise(() => invoke(updateItem, { id: item.id, ...data }))),
      Effect.tap((item) =>
        Effect.allPar(
          // @ts-expect-error the types here are wrong. They use the select type instead of data type
          Effect.promise(() => setQueryData(item)),
          revalidate,
          invalidateQueries,
          Effect.if(
            item.identifier === identifier,
            Effect.unit(),
            Effect.promise(() => router.push(Routes.AdminItemsItem({ identifier: item.identifier }))),
          ),
        )
      ),
      Effect.runPromise,
    );

  return { onSubmit, item: O.some(item) };
};

export const item = {
  useCreate,
  useUpdate,
};
