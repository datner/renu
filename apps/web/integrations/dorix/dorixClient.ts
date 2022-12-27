import * as E from "fp-ts/Either"
import * as RE from "fp-ts/ReaderEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { constVoid, pipe, tuple, tupled } from "fp-ts/function"
import { RequestOptions } from "integrations/http/httpClient"
import { sequenceS } from "fp-ts/Apply"
import { getEnvVar } from "src/core/helpers/env"
import {
  ManagementClient,
  ManagementIntegrationEnv,
} from "integrations/management/managementClient"
import { ensureType } from "src/core/helpers/zod"
import { DorixVendorData } from "./types"
import { ManagementProvider, OrderState } from "@prisma/client"
import { ReportOrderFailedError } from "integrations/management/managementErrors"
import { ensureManagementMatch } from "integrations/management/managementGuards"
import { MenuResponse, OrderResponse, StatusResponse, toOrder } from "./dorixHelpers"
import { Order as DorixOrder } from "./types"
import { singletonBreaker } from "integrations/http/circuitBreaker"
import { httpClientError } from "integrations/http/httpErrors"

const headers = pipe(
  getEnvVar("DORIX_API_KEY"),
  E.map((apiKey) => ({ Authorization: `Bearer ${apiKey}` }))
)

const getVendorData = pipe(
  RE.asks((env: ManagementIntegrationEnv) => env.managementIntegration),
  RE.chainEitherKW(ensureManagementMatch(ManagementProvider.DORIX)),
  RE.map((i) => i.vendorData),
  RE.chainEitherKW(ensureType(DorixVendorData))
)

const baseOptions = pipe(
  getVendorData,
  RE.chainEitherKW((v) =>
    sequenceS(E.Apply)({
      prefixUrl: getEnvVar(v.isQA ? "DORIX_QA_API_URL" : "DORIX_API_URL"),
      headers,
    })
  )
)

const dorixBreaker = singletonBreaker("Dorix")

export const dorixRequest = (url: string | URL, options?: RequestOptions | undefined) =>
  pipe(
    baseOptions,
    RE.map((opts) =>
      tuple(new URL(url, opts.prefixUrl), {
        ...options,
        headers: Object.assign(opts.headers, options?.headers),
      })
    ),
    RTE.fromReaderEither,
    RTE.chainW(tupled(dorixBreaker))
  )

const getStatus = (orderId: number, branchId: string) =>
  pipe(
    dorixRequest(`/v1/order/${orderId}/status`, { searchParams: { branchId, source: "RENU" } }),
    RTE.chainTaskEitherKW((res) => res.json),
    RTE.chainEitherKW(ensureType(StatusResponse))
  )

const postOrder = (json: DorixOrder) =>
  pipe(
    dorixRequest(`/v1/order`, { json, method: "POST" }),
    RTE.chainTaskEitherKW((res) => res.json),
    RTE.chainEitherKW(ensureType(OrderResponse))
  )

const getMenu = (branchId: string) =>
  pipe(
    dorixRequest(`/v1/menu/branch/${branchId}`),
    RTE.chainTaskEitherKW((res) => res.json),
    RTE.chainEitherKW(ensureType(MenuResponse))
  )

type Response<A extends { ack: true }> = { ack: false; message?: string } | A

const ensureSuccess =
  <E>(onError: (err: unknown) => E) =>
  <A extends { ack: true }>(orderResponse: Response<A>): E.Either<E, A> =>
    orderResponse.ack ? E.right(orderResponse) : E.left(onError(new Error(orderResponse.message)))

export const dorixClient: ManagementClient = {
  reportOrder: (order) =>
    pipe(
      RTE.fromReaderEither(getVendorData),
      RTE.map(({ branchId }) => branchId),
      RTE.map(toOrder(order)),
      RTE.chainW(postOrder),
      RTE.chainEitherKW(
        ensureSuccess((error): ReportOrderFailedError => ({ tag: "ReportOrderFailedError", error }))
      ),
      RTE.map(constVoid)
    ),

  getOrderStatus: (order) =>
    pipe(
      RTE.fromReaderEither(getVendorData),
      RTE.chainW(({ branchId }) => getStatus(order.id, branchId)),
      RTE.map((p) => {
        switch (p.order.status) {
          case "FAILED":
          case "UNREACHABLE":
            return OrderState.Cancelled

          case "AWAITING_TO_BE_RECEIVED":
            return OrderState.Unconfirmed

          default:
            return OrderState.Confirmed
        }
      })
    ),

  getVenueMenu: () =>
    pipe(
      RTE.fromReaderEither(getVendorData),
      RTE.chainW(({ branchId }) => getMenu(branchId)),
      RTE.chainEitherKW(ensureSuccess(httpClientError)),
      RTE.map((req) => req.data.menu)
    ),
}
