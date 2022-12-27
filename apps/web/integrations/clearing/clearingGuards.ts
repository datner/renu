import { ClearingIntegration, ClearingProvider } from "@prisma/client"
import * as E from "fp-ts/Either"
import { ClearingMismatchError } from "./clearingErrors"

export const ensureClearingMatch =
  (provider: ClearingProvider) =>
  (integration: ClearingIntegration): E.Either<ClearingMismatchError, ClearingIntegration> =>
    integration.provider === provider
      ? E.right(integration)
      : E.left<ClearingMismatchError>({
          tag: "ClearingMismatchError",
          given: integration.provider,
          needed: provider,
        })
