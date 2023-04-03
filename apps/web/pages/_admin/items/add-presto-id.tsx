import { useMutation, useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import { Button, LoadingOverlay, Select, TextInput } from "@mantine/core";
import { Suspense, useDeferredValue, useMemo, useState } from "react";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import setPrestoId from "src/items/mutations/_admin/setPrestoId";

function Yeah() {
  const [value, setValue] = useState<any>(null);
  const [_id, setId] = useState("");
  const id = useDeferredValue(_id);
  const [{ categories }] = useQuery(getCurrentVenueCategories, {});
  const [mutate] = useMutation(setPrestoId);
  const data = useMemo(() =>
    pipe(
      categories,
      A.flatMap(cat => cat.categoryItems),
      A.map(it => it.Item),
      A.map(it => ({
        value: String(it.id),
        label: it.identifier,
        group: (it.managementRepresentation as any)?.id ? "Has Id" : "No Id",
      })),
    ), [categories]);

  return (
    <>
      <Select
        value={value}
        onChange={setValue}
        label="Pick an item"
        placeholder="Pick One"
        data={data}
      />
      <TextInput label="Presto Id" value={id} onChange={e => setId(e.currentTarget.value)} />
      <Button className="btn btn-primary" onClick={() => mutate({ itemId: Number(value), prestoId: id })}>
        save
      </Button>
    </>
  );
}

export default function _AdminItemsAddPrestoId() {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <div className="grid w-full place-items-center">
        <Yeah />
      </div>
    </Suspense>
  );
}
