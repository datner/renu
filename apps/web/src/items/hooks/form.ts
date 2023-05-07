import { Routes } from "@blitzjs/next";
import { invalidateQuery, invoke, setQueryData, useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { Common } from "database-helpers";
import { nanoid } from "nanoid";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { Item } from "shared";
import getUploadUrl from "src/admin/mutations/getUploadUrl";
import { ItemFormSchema } from "src/admin/validations/item-form";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import createDbItem from "../mutations/createItem";
import updateItem from "../mutations/updateItem";
import getItem from "../queries/getItem";
import getItemNew from "../queries/getItemNew";
import getItems from "../queries/getItems";

const invalidateQueries = Effect.allPar([
  Effect.promise(() => invalidateQuery(getItems)),
  Effect.promise(() => invalidateQuery(getCurrentVenueCategories)),
]);

export const FullItem = Schema.extend(
  Schema.struct({
    content: Schema.array(Common.Content),
    modifiers: Schema.array(Item.Modifier.fromPrisma),
  }),
)(Item.Item);
export interface FullItem extends Schema.To<typeof FullItem> { }

const revalidate = Effect.sync(() => navigator.sendBeacon("/api/revalidate-current"));

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
    (data: Schema.To<typeof ItemFormSchema>) => {
      return pipe(
        Effect.succeed(data.imageFile),
        Effect.flatMap(O.fromNullable),
        Effect.flatMap(uploadImage(data.identifier)),
        Effect.catchAll(() => Effect.succeed(data.image ?? "")),
        Effect.flatMap((image) => Effect.promise(() => invoke(createDbItem, { ...data, image }))),
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

  return { onSubmit, item: O.none(), key: "new" };
};

const useUpdate = (identifier: string) => {
  const router = useRouter();
  const [item, { setQueryData }] = useQuery(getItemNew, identifier, { select: Schema.decode(FullItem) });

  const onSubmit = (data: Schema.To<typeof ItemFormSchema>) =>
    pipe(
      Effect.succeed(data.imageFile),
      Effect.flatMap(O.fromNullable),
      Effect.flatMap(uploadImage(data.identifier)),
      Effect.catchAll(() => Effect.succeed(data.image ?? "")),
      Effect.flatMap((image) => Effect.promise(() => invoke(updateItem, { id: item.id, ...data, image }))),
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

  return { onSubmit, item: O.some(item), key: item.id };
};

export const item = {
  useCreate,
  useUpdate,
};
