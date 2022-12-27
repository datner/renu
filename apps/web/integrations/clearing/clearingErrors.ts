import { ClearingProvider } from "db"

export type ClearingError = ClearingMismatchError
export type ClearingValidationError = TransactionNotFoundError | TransactionFailedError

export type ClearingMismatchError = {
  tag: "ClearingMismatchError"
  needed: ClearingProvider
  given: ClearingProvider
}

export type TransactionFailedError = {
  tag: "TransactionFailedError"
  orderId: number
  error: unknown
}

export type TransactionNotFoundError = {
  tag: "TransactionNotFoundError"
  provider: ClearingProvider
  error: unknown
}

export type InvoiceFailedError = {
  tag: "InvoiceFailedError"
  txId: string
}

export const clearingMismatchError =
  (needed: ClearingProvider) =>
  (given: ClearingProvider = "UNKNOWN" as ClearingProvider): ClearingMismatchError => ({
    tag: "ClearingMismatchError",
    needed,
    given,
  })
