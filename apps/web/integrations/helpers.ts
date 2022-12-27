import { foldMap } from "fp-ts/Array"
import { tryCatch } from "fp-ts/TaskEither"
import { MonoidSum } from "fp-ts/number"
import db, { ClearingProvider as ClearingKind } from "db"
import { prismaNotFound } from "src/core/helpers/prisma"
import { host, NoEnvVarError } from "src/core/helpers/env"
import { ZodParseError } from "src/core/helpers/zod"

export type ReduceableItem = {
  price: number
  quantity: number
}

export type GenericError = ZodParseError | NoEnvVarError

export type GetAmount = (items: ReduceableItem[]) => number
export const getAmount: GetAmount = foldMap(MonoidSum)((it) => it.quantity * it.price)

export const getOrder = (id: number) =>
  tryCatch(() => db.order.findUniqueOrThrow({ where: { id } }), prismaNotFound)

export const successUrl = `${host()}/payments/success`
export const errorUrl = `${host()}/payments/error`
export const cancelUrl = (provider: ClearingKind) => `${host()}/payments/${provider}/cancel`
export const callbackUrl = `${host()}/api/payments/callback`
