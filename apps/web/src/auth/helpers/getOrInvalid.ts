import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"

export const getOrInvalid = (o: O.Option<{ id: number }>) =>
  pipe(
    o,
    O.map((o) => o.id),
    O.getOrElse(() => -1)
  )
