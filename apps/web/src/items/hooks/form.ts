import { getAntiCSRFToken } from "@blitzjs/auth";
import { Routes } from "@blitzjs/next";
import { invalidateQuery, invoke, setQueryData, useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { nanoid } from "nanoid";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Item } from "shared";
import { Common } from "shared/schema";
import getUploadUrl from "src/admin/mutations/getUploadUrl";
import { ItemFormSchema } from "src/admin/validations/item-form";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import createDbItem from "../mutations/createItem";
import updateItem from "../mutations/updateItem";
import getItem from "../queries/getItem";
import getItemNew from "../queries/getItemNew";
import getItems from "../queries/getItems";

const invalidateQueries = Effect.all([
  Effect.promise(() => invalidateQuery(getItems)),
  Effect.promise(() => invalidateQuery(getCurrentVenueCategories)),
], { discard: true, concurrency: "unbounded" });

export const FullItem = Schema.extend(
  Schema.struct({
    content: Schema.array(Common.Content),
    modifiers: Schema.array(Item.Modifier.fromPrisma),
  }),
)(Item.Item);
export interface FullItem extends Schema.To<typeof FullItem> {}

const revalidate = Effect.sync(() => {
  const antiCSRFToken = getAntiCSRFToken();
  return fetch("/api/revalidate-current", { headers: { "anti-csrf": antiCSRFToken } });
});

const uploadImage = (identifier: string) => (file: File) =>
  pipe(
    Effect.promise(() =>
      invoke(getUploadUrl, {
        name: `${identifier}-${nanoid()}.${file.name.split(".").pop()}`,
      })
    ),
    Effect.flatMap(_ =>
      Effect.promise(async () =>
        new Request(_.url, {
          method: "POST",
          headers: {
            ..._.headers,
            "Content-Length": `${file.size + 5000}`,
          },
          body: await file.arrayBuffer(),
        })
      )
    ),
    Effect.flatMap(_ => Effect.promise(() => fetch(_))),
    Effect.flatMap(_ => Effect.promise(() => _.json())),
    Effect.map(_ => _.data.attributes.origin_path as string),
  );

const useCreate = (redirect = false) => {
  const router = useRouter();

  const onSubmit = useCallback(
    (data: Schema.From<typeof ItemFormSchema>) => {
      return pipe(
        Effect.succeed(data.imageFile),
        Effect.flatMap(O.fromNullable),
        Effect.flatMap(uploadImage(data.identifier)),
        Effect.catchAll(() => Effect.succeed(data.image.src ?? "")),
        Effect.flatMap((image) => Effect.promise(() => invoke(updateItem, { ...data, image }))),
        // TODO: change update to upsert, consolidate flows
        Effect.tap(() => revalidate),
        Effect.tap((item) => Effect.sync(() => setQueryData(getItem, { identifier: item.identifier }, item))),
        Effect.tap(() => invalidateQueries),
        Effect.tap(({ identifier }) =>
          Effect.if(
            redirect,
            {
              onTrue: Effect.sync(() => router.push(Routes.AdminItemsItem({ identifier }))),
              onFalse: Effect.unit,
            },
          )
        ),
        Effect.runPromise,
      );
    },
    [redirect, router],
  );

  return { onSubmit, item: O.none(), key: "new" };
};

const useUpdate = (identifier: string) => {
  const router = useRouter();

  const [item, { setQueryData }] = useQuery(getItemNew, identifier, { select: Schema.decodeSync(FullItem) });

  const onSubmit = (data: Schema.From<typeof ItemFormSchema>) =>
    pipe(
      Effect.succeed(data.imageFile),
      Effect.flatMap(O.fromNullable),
      Effect.flatMap(uploadImage(data.identifier)),
      Effect.catchAll(() => Effect.succeed(data.image.src ?? "")),
      Effect.flatMap((image) => Effect.promise(() => invoke(updateItem, { id: item.id, ...data, image }))),
      Effect.tap((item) =>
        Effect.all([
          // @ts-expect-error the types here are wrong. They use the select type instead of data type
          Effect.promise(() => setQueryData(item)),
          revalidate,
          invalidateQueries,
          Effect.if(
            item.identifier === identifier,
            {
              onTrue: Effect.unit,
              onFalse: Effect.promise(() => router.push(Routes.AdminItemsItem({ identifier: item.identifier }))),
            },
          ),
        ])
      ),
      Effect.runPromise,
    );

  return { onSubmit, item: O.some(item), key: item.id };
};

export const item = {
  useCreate,
  useUpdate,
};
