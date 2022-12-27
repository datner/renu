import * as E from "fp-ts/Either"
import * as RTE from "fp-ts/ReaderTaskEither"
import { flow, pipe, tuple, tupled } from "fp-ts/function"
import { getEnvVar } from "src/core/helpers/env"
import {
  ClearingIntegrationEnv,
  FullOrderWithItems,
  ClearingProvider,
} from "integrations/clearing/clearingProvider"
import { ensureClearingMatch } from "integrations/clearing/clearingGuards"
import { ClearingIntegration, ClearingProvider as CP, Order } from "@prisma/client"
import { ensureType, ZodParseError } from "src/core/helpers/zod"
import { request, RequestOptions } from "integrations/http/httpClient"
import { TransactionFailedError } from "integrations/clearing/clearingErrors"
import { z, ZodError } from "zod"
import { Credentials } from "./lib"
import { JSDOM } from "jsdom"
import { cancelUrl, errorUrl, getAmount, successUrl } from "integrations/helpers"
import { Options } from "got"

const baseUrl = getEnvVar("CREDIT_GUARD_API_URL")

const baseOptions = pipe(
  baseUrl,
  E.map((prefixUrl) => new Options({ prefixUrl, method: "POST" }))
)

export const creditGuardRequest = (url: string | URL, opts?: RequestOptions | undefined) =>
  pipe(
    baseOptions,
    E.map((base) => new Options(url, opts, base)),
    E.map((opts) => tuple(opts.url ?? url, opts)),
    RTE.fromEither,
    RTE.chainW(tupled(request))
  )

const getDoDealXml =
  (order: FullOrderWithItems, integration: ClearingIntegration) => (mid: string) =>
    `
<ashrait>
	<request>
		<version>2000</version>
		<language>HEB</language>
		<command>doDeal</command>
		<doDeal>
			<cardNo>CGMPI</cardNo>
			<transactionCode>Internet</transactionCode>
			<transactionType>Debit</transactionType>
			<creditType>RegularCredit</creditType>
			<validation>TxnSetup</validation>
			<mpiValidation>AutoComm</mpiValidation>

			<user>renu customer</user>
			<currency>ILS</currency>
			<terminalNumber>${integration.terminal}</terminalNumber>
			<total>${getAmount(order.items)}</total>
			<mid>${mid}</mid>
			<uniqueid>${order.id}</uniqueid>
      <successUrl>${successUrl}</successUrl>
      <errorUrl>${errorUrl}</errorUrl>
      <cancelUrl>${cancelUrl("CREDIT_GUARD")}</cancelUrl>
      <customerData>
				<userData1>${order.venueId}</userData1>
			</customerData>
		</doDeal>
	</request>
</ashrait>
`

const getCredentials = (ci: ClearingIntegration) =>
  pipe(
    ci,
    ensureClearingMatch(CP.CREDIT_GUARD),
    E.map((ci) => ci.vendorData),
    E.chainW(ensureType(Credentials))
  )

const parseXml = (xml: string) =>
  E.tryCatch<ZodParseError, XMLDocument>(
    () => new JSDOM(xml, { contentType: "text/xml" }).window.document,
    () => ({
      tag: "zodParseError",
      raw: xml,
      error: new z.ZodError<string>([{ message: "xml couldn't parse", code: "custom", path: [] }]),
    })
  )

// Not sure this is correct, maybe it's s !== "000"
const ResponseCodeSuccess = z.string().refine((s) => s === "000")

const customZodError = (message: string): ZodParseError => ({
  tag: "zodParseError",
  raw: null,
  error: new ZodError([{ message, code: "custom", path: [] }]),
})

const getTextContent =
  (tag: string) =>
  (doc: XMLDocument): E.Either<ZodParseError, string> =>
    pipe(
      doc.querySelector(tag),
      E.fromNullable(customZodError(`xml element ${tag} null`)),
      E.chainNullableK(customZodError(`no text content in ${tag}`))((el) => el.textContent)
    )

const checkReponseCode = (_: string | null) =>
  flow(
    getTextContent("cgGatewayResponseCode"),
    E.chainFirst(ensureType(ResponseCodeSuccess)),
    E.mapLeft(
      () =>
        ({
          tag: "TransactionFailedError",
          orderId: -1,
          error: new Error("Credit Guard transaction failed"),
        } as TransactionFailedError)
    )
  )

const getPageUrl = getTextContent("mpiHostedPageUrl")
const getInquireTransactionsXml = ({ txId }: Order, terminal: string, mid: string) =>
  `
<ashrait>
  <request>
    <version>2000</version>
		<language>ENG</language>
    <command>inquireTransactions</command>
    <inquireTransactions>
      <queryName>mpiTransaction</queryName>
      <terminalNumber>${terminal}</terminalNumber>
      <mid>${mid}</mid>
      <mpiTransactionId>${txId}</mpiTransactionId>
    </inquireTransactions>
  </request>
</ashrait>
`

export const creditGuardProvider: ClearingProvider = {
  getClearingPageLink: (order) =>
    RTE.asksReaderTaskEitherW((env: ClearingIntegrationEnv) =>
      pipe(
        RTE.fromEither(getCredentials(env.clearingIntegration)),
        RTE.map((cred) => ({
          int_in: getDoDealXml(order, env.clearingIntegration)(cred.mid),
          user: cred.username,
          password: cred.password,
        })),
        RTE.chainW((form) => creditGuardRequest("/xpo/Relay", { form })),
        RTE.chainTaskEitherKW((r) => r.text),
        RTE.chainEitherKW(parseXml),
        RTE.chainEitherKW(getPageUrl)
      )
    ),

  validateTransaction: (order) =>
    RTE.asksReaderTaskEitherW((env: ClearingIntegrationEnv) =>
      pipe(
        RTE.fromEither(getCredentials(env.clearingIntegration)),
        RTE.map((cred) => ({
          int_in: getInquireTransactionsXml(order, env.clearingIntegration.terminal, cred.mid),
          user: cred.username,
          password: cred.password,
        })),
        RTE.chainW((form) => creditGuardRequest("/xpo/Relay", { form })),
        RTE.chainTaskEitherKW((r) => r.text),
        RTE.chainEitherKW(parseXml),
        RTE.chainFirstEitherKW(checkReponseCode(order.txId)),
        RTE.map(() => "credit-guard-tx-id")
      )
    ),
}
