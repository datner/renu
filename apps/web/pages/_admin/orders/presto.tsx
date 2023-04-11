import { useMutation } from "@blitzjs/rpc";
import { Button, LoadingOverlay, TextInput } from "@mantine/core";
import { Suspense, useDeferredValue, useState } from "react";
import sendPrestoJson from "src/admin/mutations/sendPrestoJson";

function Yeah() {
  const [_id, setId] = useState("");
  const id = useDeferredValue(_id);
  const [mutate] = useMutation(sendPrestoJson);
  return (
    <>
      <TextInput label="Order Id" value={id} onChange={e => setId(e.currentTarget.value)} />
      <Button className="btn btn-primary" onClick={() => mutate({ id: Number(_id) })}>
        save
      </Button>
    </>
  );
}

export default function _AdminOrdersPresto() {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <div className="grid w-full place-items-center">
        <Yeah />
      </div>
    </Suspense>
  );
}

