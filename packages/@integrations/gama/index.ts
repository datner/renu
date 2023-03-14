import * as Layer from "@effect/io/Layer";
import * as Effect from "@effect/io/Effect";
import * as Context from "@effect/data/Context";
import * as Data from "@effect/data/Data";
import * as P from "@effect/schema/Parser";
import { pipe } from "@effect/data/Function";
import { CircuitBreaker, Clearing, Http } from "@integrations/core";
import * as Settings from "./settings";
import {
  CreateSessionInput,
  CreateSessionPayload,
  CreateSessionResponse,
  maxInstallments,
  paymentCurrency,
  paymentNetwork,
  PaymentNetworks,
  paymentProcess,
  PaymentProcesses,
} from "./schema";
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
  Effect.serviceWithEffect(
    Settings.IntegrationService,
    (int) =>
      P.decodeEffect(CreateSessionPayload)({
        clientId: int.vendorData.id,
        clientSecret: int.vendorData.secret_key,
        userIp: "127.0.0.1",
        maxInstallments,
        paymentRequest: {
          paymentAmount: input.paymentAmount,
          orderId: input.orderId,
          sendSMS: true,
          payerName: input.payerName,
          autoCapture: true,
          paymentNetwork,
          paymentProcess,
          paymentCurrencyType: paymentCurrency,
          payerPhoneNumber: input.payerPhoneNumber,
          paymentDescription: input.venueName,
        },
      }),
  );

export interface Service {
  readonly _tag: "GamaService";
  readonly createSession: (input: CreateSessionInput) => any;
}
export const Tag = Context.Tag<Service>();

class GamaError extends Data.TaggedClass("GamaError")<
  { readonly errors: readonly unknown[] }
> {}

const provideHttpConfig = Effect.provideServiceEffect(
  Http.HttpConfigService,
  Effect.gen(function* ($) {
    const { vendorData } = yield* $(
      Effect.service(Settings.IntegrationService),
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
  }),
);

const parseIntegration = Effect.provideServiceEffect(
  Settings.IntegrationService,
  Effect.serviceWith(Clearing.Settings, P.parse(Settings.Integration)),
);

export const layer = Layer.effect(
  Tag,
  Effect.gen(function* ($) {
    const breaker = yield* $(CircuitBreaker.makeBreaker({ name: "Gama" }));
    const Client = yield* $(Http.Service);

    return {
      _tag: "GamaService" as const,
      createSession: (input) =>
        pipe(
          toPayload(input),
          Effect.flatMap((body) =>
            Client.request("/api/gpapi/v1/session", {
              method: "POST",
              body: JSON.stringify(P.encode(CreateSessionPayload)(body)),
            })
          ),
          Effect.flatMap(Http.toJson),
          Effect.tap((b) =>
            Effect.sync(() => console.log(inspect(b, false, null, true)))
          ),
          Effect.flatMap(P.parseEffect(CreateSessionResponse)),
          Effect.flatMap((data) =>
            data.kind === "success" ? Effect.succeed(data) : pipe(
              Effect.sync(() =>
                console.log(inspect(data.errors, false, null, true))
              ),
              Effect.flatMap(() => Effect.fail(new GamaError(data))),
            )
          ),
          Effect.map((data) => data.session),
          breaker(Http.isRetriable),
          Effect.catchTag("GamaError", (e) =>
            pipe(
              Effect.sync(() =>
                console.log(inspect(e.errors, false, null, true))
              ),
              Effect.flatMap(() => Effect.dieMessage("Gama returned an error")),
            )),
          Effect.refineTagOrDie('CircuitBreakerError'),
          provideHttpConfig,
          parseIntegration,
        ),
    };
  }),
);
