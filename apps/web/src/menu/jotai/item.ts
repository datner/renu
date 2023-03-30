import { none, Option, some } from "fp-ts/Option";
import { atom } from "jotai";
import { OrderItem } from "src/menu/jotai/order";

export const _itemAtom = atom<Option<OrderItem["item"]>>(none);

export const itemAtom = atom(
  (get) => get(_itemAtom),
  (_, set, update: OrderItem["item"]) => set(_itemAtom, some(update)),
);

export const itemModalOpenAtom = atom(false);
