import { Item } from "db"
import { get } from "./common"
import { pipe } from "fp-ts/function"
import * as O from "monocle-ts/Optional"

export const priceOption = pipe(O.id<Item | null>(), O.fromNullable, O.prop("price")).getOption

export const price = get(priceOption, 0)
