import { pipe } from "@effect/data/Function";
import * as S from "@effect/data/String";
import { toShekel } from "./content";

export const shekelParser = (st = "") =>
  pipe(st, S.replace(/^‏|\s?\₪\s?|[,\.]*/g, ""), (s) => (/\d\s$/.test(st) ? s.slice(0, -2) : s));

export const shekelFormatter = (s = "") => Number.isNaN(Number(s)) ? s : toShekel(Number(s));
