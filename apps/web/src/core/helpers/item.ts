import { Item } from "db";
import { pipe } from "fp-ts/function";
import * as O from "monocle-ts/Optional";
import { get } from "./common";

export const priceOption = pipe(O.id<Item | null>(), O.fromNullable, O.prop("price")).getOption;

export const price = get(priceOption, 0);
