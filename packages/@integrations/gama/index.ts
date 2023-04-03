import * as Context from "@effect/data/Context";
import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Config from "@effect/io/Config";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as P from "@effect/schema/Parser";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { CircuitBreaker, Clearing, Http } from "@integrations/core";
import * as jose from "jose";
import {
  CreateSessionErrorBody,
  CreateSessionInput,
  CreateSessionPayload,
  CreateSessionSuccess,
  maxInstallments,
  paymentCurrency,
  paymentNetwork,
  PaymentNetworks,
  paymentProcess,
  PaymentProcesses,
  Session,
} from "./schema";
import * as Settings from "./settings";
export * as Schema from "./schema";
import * as Cause from "@effect/io/Cause";
import { ClearingIntegration } from "database";
import { OrderRepository } from "database-helpers/order";
import { Order } from "shared";
import { inspect } from "util";

interface BitPayment {
  readonly _tag: "BitPayment";
  readonly sendSMS: boolean;
  readonly paymentProcess: typeof PaymentProcesses.bit;
  readonly paymentNetwork: typeof PaymentNetworks.bit;
}

interface CreditPayment {
  readonly _tag: "CreditPayment";
  readonly paymentProcess: typeof PaymentProcesses.creditCard;
  readonly paymentNetwork: typeof PaymentNetworks.shva;
}

type Payment = BitPayment | CreditPayment;

const toPayload = (
  input: CreateSessionInput,
) =>
  Effect.flatMap(Settings.IntegrationService, (int) =>
    P.decodeEffect(CreateSessionPayload)({
      clientId: int.vendorData.id,
      clientSecret: int.vendorData.secret_key,
      userIp: "1.2.3.4",
      maxInstallments,
      paymentRequest: {
        paymentAmount: input.paymentAmount,
        orderId: input.orderId,
        payerName: input.payerName,
        autoCapture: true,
        paymentNetwork,
        paymentProcess,
        paymentCurrencyType: paymentCurrency,
        payerPhoneNumber: input.payerPhoneNumber,
        paymentDescription: input.venueName,
      },
    }));

export interface Service {
  readonly _tag: "GamaService";
  readonly createSession: (
    input: CreateSessionInput,
  ) => Effect.Effect<
    ClearingIntegration,
    CircuitBreaker.CircuitBreakerError,
    Session
  >;
  readonly attachTxId: (
    jtw: string,
  ) => Effect.Effect<
    OrderRepository,
    Cause.NoSuchElementException | ParseResult.ParseError | TransactionNotSuccessfulError,
    Order.Decoded
  >;
}
export const Gama = Context.Tag<"Gama", Service>();

const provideHttpConfig = Effect.provideServiceEffect(
  Http.HttpConfigService,
  Effect.orDie(Effect.gen(function*($) {
    const { vendorData } = yield* $(
      Settings.IntegrationService,
    );
    const { env } = vendorData;
    const config = env === "production" ? Settings.GamaConfig : Config.nested(env)(Settings.GamaConfig);
    const { url } = yield* $(Effect.config(config));

    return {
      baseUrl: url,
    };
  })),
);

const parseIntegration = Effect.provideServiceEffect(
  Settings.IntegrationService,
  Effect.map(Clearing.Settings, P.parse(Settings.Integration)),
);

const JWTPayload = pipe(
  Schema.struct({
    orderId: Order.Id,
    iat: Schema.number,
  }),
  Schema.optionsFromOptionals({
    transactionId: pipe(
      Schema.number,
      Schema.transform(
        Schema.string,
        String,
        Number,
      ),
      Schema.fromBrand(Order.TxId),
    ),
    jtoken: Schema.string,
    paymentResponse: Schema.struct({
      transactionStatus: Schema.string,
      issuerAuthorizationNumber: Schema.number,
      cardNumber: Schema.number,
    }),
  }),
);

export const layer = Layer.effect(
  Gama,
  Effect.gen(function*($) {
    const breaker = yield* $(CircuitBreaker.makeBreaker({ name: "Gama" }));
    const Client = yield* $(Http.Http);

    return {
      _tag: "GamaService" as const,
      createSession: (input) =>
        pipe(
          toPayload(input),
          Effect.flatMap((body) =>
            Client.request("/api/gpapi/v1/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(P.encode(CreateSessionPayload)(body)),
            })
          ),
          Effect.flatMap(Http.toJson),
          Effect.tap((b) => Effect.sync(() => console.log(inspect(b, false, null, true)))),
          Effect.flatMap(P.parseEffect(CreateSessionSuccess)),
          Effect.map((data) => data.session),
          breaker(),
          Effect.catchTag("HttpUnprocessableEntityError", (e) =>
            pipe(
              Http.toJson(e.response),
              Effect.flatMap(P.parseEffect(CreateSessionErrorBody)),
              Effect.tap(b => Effect.log(inspect(b, false, null, true))),
              Effect.map((body) => body.errors),
              Effect.map(A.map((err) => err.msg)),
              Effect.map(A.join("\n")),
              Effect.map(s => "\n\n" + s),
              Effect.flatMap(Effect.dieMessage),
            )),
          Effect.refineTagOrDie("CircuitBreakerError"),
          provideHttpConfig,
          parseIntegration,
        ),
      attachTxId: jwt =>
        Effect.gen(function*($) {
          // You're supposed to validate the signature, but it's not signed correctly
          const decoded = jose.decodeJwt(jwt);
          const { orderId, transactionId, paymentResponse } = yield* $(Schema.parseEffect(JWTPayload)(decoded));
          const status = yield* $(O.map(paymentResponse, pr => pr.transactionStatus));
          if (status !== "approved") {
            yield* $(Effect.fail(new TransactionNotSuccessfulError()));
          }
          const orderRepository = yield* $(OrderRepository);
          const txId = yield* $(Effect.getOrFail(transactionId));

          return yield* $(orderRepository.setTransactionId(orderId, txId));
        }),
    };
  }),
);

class TransactionNotSuccessfulError extends Data.TaggedClass("TransactionNotSuccessfulError")<{}> {}
