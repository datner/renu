import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Config from "@effect/io/Config";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as P from "@effect/schema/Parser";
import * as Schema from "@effect/schema/Schema";
import { CircuitBreaker, Http } from "@integrations/core";
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
} from "./schema";
export * as Schema from "./schema";
import { Order, Venue } from "shared";
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
  int: Venue.Clearing.GamaIntegration,
) =>
  P.decode(CreateSessionPayload)({
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
  });

interface Gama {
  readonly _: unique symbol;
}
export const Gama = Context.Tag<Gama, Effect.Effect.Success<typeof GamaService>>();

export const GamaConfig = Config.all({
  url: Config.string(`api.url`),
});

const provideHttpConfig = (int: Venue.Clearing.GamaIntegration) =>
  Effect.provideServiceEffect(
    Http.HttpConfigService,
    pipe(
      GamaConfig,
      Config.nested(int.vendorData.env),
      Config.nested("gama"),
      Effect.config,
      Effect.map(({ url }) => ({ baseUrl: url })),
      Effect.orDie,
    ),
  );

const JWTPayload = pipe(
  Schema.struct({
    orderId: Order.Id,
    transactionId: Order.TxId,
  }),
);

const GamaService = Effect.gen(function*($) {
  const breaker = yield* $(CircuitBreaker.makeBreaker({ name: "Gama" }));
  const Client = yield* $(Http.Http);

  return {
    createSession: (input: CreateSessionInput, integration: Venue.Clearing.GamaIntegration) =>
      pipe(
        toPayload(input, integration),
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
        Effect.flatMap(P.parse(CreateSessionSuccess)),
        Effect.map((data) => data.session),
        breaker(),
        Effect.catchTag("HttpUnprocessableEntityError", (e) =>
          pipe(
            Http.toJson(e.response),
            Effect.flatMap(P.parse(CreateSessionErrorBody)),
            Effect.tap(b => Effect.log(inspect(b, false, null, true))),
            Effect.map((body) => body.errors),
            Effect.map(A.map((err) => err.msg)),
            Effect.map(A.join("\n")),
            Effect.map(s => "\n\n" + s),
            Effect.flatMap(Effect.dieMessage),
          )),
        provideHttpConfig(integration),
      ),
    attachTxId: (jwt: string) =>
      pipe(
        Effect.sync(() => jose.decodeJwt(jwt)),
        Effect.tap((t) => Effect.sync(() => console.log(inspect(t, false, null, true)))),
        Effect.flatMap(Schema.parse(JWTPayload)),
        Effect.tap(_ => Order.setTransactionId(_.orderId, _.transactionId)),
        Effect.map(_ => _.orderId),
      ),
  };
});

export const layer = Layer.effect(
  Gama,
  GamaService,
);
