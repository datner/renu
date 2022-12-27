import { ClearingProvider, Order } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { creditGuardProvider } from "integrations/creditGuard/creditGuardProvider"
import { payplusProvider } from "integrations/payplus/payplusProvider"
import { ClearingProviderEnv, FullOrderWithItems } from "./clearingProvider"

export const providers = {
  [ClearingProvider.PAY_PLUS]: payplusProvider,
  [ClearingProvider.CREDIT_GUARD]: creditGuardProvider,
} as const

export const getClearingPageLink = <OF extends FullOrderWithItems>(order: OF) =>
  RTE.asksReaderTaskEitherW((env: ClearingProviderEnv) =>
    env.clearingProvider.getClearingPageLink(order)
  )

export const validateTransaction = <O extends Order>(order: O) =>
  RTE.asksReaderTaskEitherW((env: ClearingProviderEnv) =>
    env.clearingProvider.validateTransaction(order)
  )
