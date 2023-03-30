import * as Layer from "@effect/io/Layer";
import * as Effect from "@effect/io/Effect";
import * as Context from "@effect/data/Context";
import * as A from "@effect/data/ReadonlyArray";
import * as P from "@effect/schema/Parser";
import { pipe } from "@effect/data/Function";
import { CircuitBreaker, Clearing, Http } from "@integrations/core";
import * as Settings from "./settings";
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
export * as Schema from "./schema";
import { inspect } from "util";
import { ClearingIntegration } from "database";

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
  pipe(
    Settings.IntegrationService,
    Effect.flatMap((int) =>
      P.decodeEffect(CreateSessionPayload)({
        clientId: int.vendorData.id,
        clientSecret: int.vendorData.secret_key,
        userIp: "192.168.32.193",
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
      }),
  ))

export interface Service {
  readonly _tag: "GamaService";
  readonly createSession: (
    input: CreateSessionInput,
  ) => Effect.Effect<
    ClearingIntegration,
    CircuitBreaker.CircuitBreakerError,
    Session
  >;
}
export const Gama = Context.Tag<Service>();

const provideHttpConfig = Effect.provideServiceEffect(
  Http.HttpConfigService,
  Effect.orDie(Effect.gen(function* ($) {
    const { vendorData } = yield* $(
      Settings.IntegrationService
    );
    const { env } = vendorData;
    const config = yield* $(Effect.config(Settings.GamaConfig));
    const url = (() => {
      switch (env) {
        case "test":
          return config.test.url;
        case "demo":
          return config.demo.url;
        case "production":
          return config.url;
      }
    })();
    return {
      baseUrl: url,
    };
  })),
);

const parseIntegration = Effect.provideServiceEffect(
  Settings.IntegrationService,
  Effect.map(Clearing.Settings, P.parse(Settings.Integration)),
);

export const layer = Layer.effect(
  Gama,
  Effect.gen(function* ($) {
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
          Effect.tap((b) =>
            Effect.sync(() => console.log(inspect(b, false, null, true)))
          ),
          Effect.flatMap(P.parseEffect(CreateSessionSuccess)),
          Effect.map((data) => data.session),
          breaker(),
          Effect.catchTag("HttpUnprocessableEntityError", (e) =>
            pipe(
              Http.toJson(e.response),
              Effect.flatMap(P.parseEffect(CreateSessionErrorBody)),
              Effect.tap(b => Effect.log(inspect(b,false, null, true))),
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
    };
  }),
);
