import * as P from "@effect/schema/Parser";
import * as S from "@effect/schema/Schema";
import { pipe } from "@effect/data/Function";
import * as Settings from "./settings";
import { Price } from "../../shared/schema/number";
import { Order } from "shared";

export const PhoneNumber = pipe(
  S.string,
  S.pattern(/^05\d{8}$/),
  S.brand("PhoneNumber"),
);
export type PhoneNumber = S.To<typeof PhoneNumber>;

export const Name = pipe(S.string, S.brand("Name"));
export type Name = S.To<typeof Name>;

export const Installments = pipe(S.literal(1), S.brand("Installments"));
export type Installments = S.To<typeof Installments>;
export const maxInstallments = Installments(1);

export const Session = pipe(S.string, S.brand("GamaSession"));
export type Session = S.To<typeof Session>;

export const AuthorizationNumber = pipe(
  S.number,
  S.brand("GamaIssuerAuthorizationNumber"),
);
export type AuthorizationNumber = S.To<typeof AuthorizationNumber>;

export const CardNumber = pipe(S.number, S.brand("GamaCardNumber"));
export type CardNumber = S.To<typeof CardNumber>;

export const PaymentNetworks = {
  bit: "bit",
  shva: "shva",
} as const;

export const PaymentNetwork = pipe(
  S.enums(PaymentNetworks),
  S.brand("PaymentNetwork"),
);
export type PaymentNetwork = S.To<typeof PaymentNetwork>;
export const paymentNetwork = PaymentNetwork(PaymentNetworks.shva);

export const PaymentProcesses = {
  creditCard: "credit_card",
  bit: "digital_wallet",
} as const;

export const PaymentProcess = pipe(
  S.enums(PaymentProcesses),
  S.brand("PaymentProcess"),
);
export type PaymentProcess = S.To<typeof PaymentProcess>;
export const paymentProcess = PaymentProcess(PaymentProcesses.creditCard);

export const PaymentCurrency = pipe(
  S.literal("ILS"),
  S.brand("PaymentCurrency"),
);
export type PaymentCurrency = S.To<typeof PaymentCurrency>;
export const paymentCurrency = PaymentCurrency("ILS");

export const CreateSessionInput = S.struct({
  paymentAmount: Price,
  payerName: Name,
  payerPhoneNumber: PhoneNumber,
  orderId: Order.Id,
  venueName: S.string,
});
export interface CreateSessionInput extends S.To<typeof CreateSessionInput> {}
export const CreateSessionPayload = S.struct({
  clientId: Settings.GamaClientId,
  clientSecret: Settings.GamaClientSecret,
  userIp: S.string,
  maxInstallments: S.number,
  customerCssUrl: pipe(S.string, S.optional),
  enableDefaultCss: pipe(S.boolean, S.optional),
  paymentRequest: S.struct({
    paymentAmount: Price,
    paymentNetwork: PaymentNetwork,
    paymentProcess: PaymentProcess,
    paymentCurrencyType: PaymentCurrency,
    paymentDescription: S.string,
    payerName: Name,
    payerPhoneNumber: PhoneNumber,
    autoCapture: pipe(S.boolean, S.optional),
    orderId: Order.Id,
    sendSMS: pipe(S.boolean, S.optional),
    captureTimeout: S.optional(S.number),
    callbackUrl: pipe(S.string, S.optional),
  }),
});
export interface CreateSessionPayload
  extends S.To<typeof CreateSessionPayload> {}

export const PaymentResponse = S.struct({
  transactionStatus: S.literal("approved"),
  issuerAuthorizationNumber: AuthorizationNumber,
  cardNumber: CardNumber,
});

export const CreateSessionData = S.struct({
  session: Session,
  paymentResponse: PaymentResponse,
});

export const CreateSessionSuccessBody = S.struct({
  success: S.literal(true),
  data: CreateSessionData,
  errors: pipe(S.array(S.never), S.itemsCount(0)),
});

export const CreateSessionErrorBody = S.struct({
  success: S.literal(false),
  data: S.null,
  errors: S.array(S.unknown),
});

export const CreateSessionSuccess = pipe(
  CreateSessionSuccessBody,
  S.transform(
    CreateSessionData,
    (res) => P.decode(CreateSessionData)(res.data),
    (data) =>
      P.decode(CreateSessionSuccessBody)({
        success: true,
        data,
        errors: [],
      }),
  ),
);
export interface CreateSessionSuccess
  extends S.To<typeof CreateSessionSuccess> {}

export const CreateSessionFailure = pipe(
  CreateSessionErrorBody,
  S.transform(
    pipe(CreateSessionErrorBody, S.pick('errors')),
    ({errors}) => ({errors}),
    ({errors}) => ({
      success: false as const,
      data: null,
      errors,
    }),
  ),
);
export interface CreateSessionFailure
  extends S.To<typeof CreateSessionFailure> {}

type CreateSessionResponse = S.To<typeof CreateSessionResponse>;
export const CreateSessionResponse = S.union(
  pipe(CreateSessionFailure, S.attachPropertySignature("kind", "failure")),
  pipe(CreateSessionSuccess, S.attachPropertySignature("kind", "success")),
);

