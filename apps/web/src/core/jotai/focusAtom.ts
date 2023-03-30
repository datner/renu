import { pipe } from "@fp-ts/core/Function";
import * as Optic from "@fp-ts/optic";
import { atom, SetStateAction, WritableAtom } from "jotai/vanilla";

export function focusAtom<Value, Result, Focused>(
  baseAtom: WritableAtom<Value, [Value], Result>,
  getOptic: (
    optic: Optic.Iso<Value, Value>,
  ) => Optic.Optic<Value, Value, Focused, never, never, Focused, Value>,
) {
  const optic = getOptic(Optic.id<Value>());
  return atom(
    (get) => pipe(get(baseAtom), Optic.get(optic)),
    (get, set, update: SetStateAction<Focused>) => {
      const change = typeof update !== "function"
        ? Optic.replace(optic)(update)
        : Optic.modify(optic)(update as (f: Focused) => Focused);

      return set(baseAtom, change(get(baseAtom)));
    },
  );
}
