import { invoke } from "@blitzjs/rpc";
import { useMutation } from "@blitzjs/rpc";
import { LoadingOverlay } from "@mantine/core";
import { Suspense, useState } from "react";
import Confetti from "react-confetti";
import blurhashify from "src/items/mutations/_admin/blurhashify";
import getCurrentVenueItems from "src/items/queries/current/getVenueItems";

function Button() {
  const [confetti, setConfetti] = useState(false);
  const [doTheThing] = useMutation(blurhashify, {
    onSuccess: () => setConfetti(true),
  });
  const doTheThingFrontend = async () => {
    const items = await invoke(getCurrentVenueItems, undefined);
    for (const item of items.filter(_ => _.image != null)) {
      const blurhash = await fetch(`https://renu.imgix.net${item.image}?fm=blurhash&w=30`)
      console.log(blurhash)
    }
  };
  return (
    <>
      {confetti && (
        <Confetti
          recycle={false}
          numberOfPieces={2_000}
          onConfettiComplete={() => setConfetti(false)}
        />
      )}

      <button onClick={() => doTheThing()} className="btn btn-primary">
        blurhashify
      </button>
    </>
  );
}

export default function _AdminItemsBlurhash() {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <div className="grid w-full place-items-center">
        <Button />
      </div>
    </Suspense>
  );
}
