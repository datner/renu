import * as Z from "@effect/io/Effect"
import { flow } from "@fp-ts/data/Function"
import * as T from "@fp-ts/data/These"
import * as S from "@fp-ts/schema/Schema"
import * as P from "@fp-ts/schema/Parser"

interface DecodeErrorOptions<A> extends ErrorOptions {
  schema: S.Schema<A>
}

export class DecodeError<A> extends Error {
  readonly _tag = "DecodeError"
  constructor(public message: string, public options: DecodeErrorOptions<A>) {
    super(message, options)
  }
}

export const decode = <A>(schema: S.Schema<A>) =>
  flow(
    P.decode(schema),
    T.absolve,
    Z.fromEither,
    Z.mapError((e) => new DecodeError("failed to decode", { cause: e, schema }))
  )
