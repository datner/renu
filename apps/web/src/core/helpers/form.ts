import { pipe } from "fp-ts/function"
import * as S from "fp-ts/string"
import { toShekel } from "./content"

export const shekelParser = (st = "") =>
  pipe(st, S.replace(/^‏|\s?\₪\s?|[,\.]*/g, ""), (s) => (/\d\s$/.test(st) ? s.slice(0, -2) : s))

export const shekelFormatter = (s = "") =>
  pipe(s, Number, (number) => (Number.isNaN(number) ? s : toShekel(number)))
