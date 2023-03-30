import { useMutation } from "@blitzjs/rpc";
import { LoadingOverlay } from "@mantine/core";
import { Suspense, useState } from "react";
import Confetti from "react-confetti";
import blurhashify from "src/items/mutations/_admin/blurhashify";

function Button() {
  const [confetti, setConfetti] = useState(false);
  const [doTheThing] = useMutation(blurhashify, {
    onSuccess: () => setConfetti(true),
  });
  return (
    <>
      {confetti && (
        <Confetti
          recycle={false}
          numberOfPieces={2_000}
          onConfettiComplete={() => setConfetti(false)}
        />
      )}

      <button onClick={() => doTheThing(null)} className="btn btn-primary">
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
