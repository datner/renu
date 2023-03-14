import * as S from "@fp-ts/schema/Schema"
import * as P from "@fp-ts/schema/Parser"
import * as E from "@fp-ts/core/Either"
import { flow } from "@fp-ts/core/Function"

import type { ParseError } from "@fp-ts/schema/ParseResult"
import type { NonEmptyReadonlyArray } from "@fp-ts/core/ReadonlyArray"

export * from "@fp-ts/schema/Parser"

export class DecodeError<A> {
  readonly _tag = "DecodeError"
  constructor(
    readonly message: string,
    readonly schema: S.Schema<A>,
    readonly errors: NonEmptyReadonlyArray<ParseError>
  ) {}
}

export const decode = <A>(schema: S.Schema<A>) =>
  flow(
    P.decode(schema),
    E.mapLeft((errors) => new DecodeError("failed to decode", schema, errors))
  )
