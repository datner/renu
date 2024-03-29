import * as S from "@effect/schema/Schema";
import { Option as O, pipe } from "effect";
import { Order } from "shared";
import { Cost } from "../../shared/schema/number";

export const PhoneNumber = pipe(
  S.string,
  S.pattern(/^05\d{8}$/),
  S.brand("PhoneNumber"),
);
export type PhoneNumber = S.Schema.To<typeof PhoneNumber>;

export const Name = pipe(S.string, S.brand("Name"));
export type Name = S.Schema.To<typeof Name>;

export const Installments = pipe(S.literal(1), S.brand("Installments"));
export type Installments = S.Schema.To<typeof Installments>;
export const maxInstallments = Installments(1);

export const Session = pipe(S.string, S.brand("GamaSession"));
export type Session = S.Schema.To<typeof Session>;

export const AuthorizationNumber = pipe(
  S.number,
  S.brand("GamaIssuerAuthorizationNumber"),
);
export type AuthorizationNumber = S.Schema.To<typeof AuthorizationNumber>;

export const CardNumber = pipe(S.number, S.brand("GamaCardNumber"));
export type CardNumber = S.Schema.To<typeof CardNumber>;

export const PaymentNetworks = {
  bit: "bit",
  shva: "shva",
} as const;

export const PaymentNetwork = pipe(
  S.enums(PaymentNetworks),
  S.brand("PaymentNetwork"),
);
export type PaymentNetwork = S.Schema.To<typeof PaymentNetwork>;
export const paymentNetwork = PaymentNetwork(PaymentNetworks.shva);

export const PaymentProcesses = {
  creditCard: "payment_card",
  bit: "digital_wallet",
} as const;

export const PaymentProcess = pipe(
  S.enums(PaymentProcesses),
  S.brand("@integrations/gama/PaymentProcess"),
);
export type PaymentProcess = S.Schema.To<typeof PaymentProcess>;
export const paymentProcess = PaymentProcess(PaymentProcesses.creditCard);

export const PaymentCurrency = pipe(
  S.literal("ILS"),
  S.brand("@integrations/gata/PaymentCurrency"),
);
export type PaymentCurrency = S.Schema.To<typeof PaymentCurrency>;
export const paymentCurrency = PaymentCurrency("ILS");

export const IFrameUrl = pipe(
  S.string,
  S.brand("IFrameUrl"),
);
export type IFrameUrl = S.Schema.To<typeof IFrameUrl>;

export const CreateSessionInput = S.struct({
  paymentAmount: Cost,
  payerName: Name,
  payerPhoneNumber: PhoneNumber,
  orderId: Order.Id,
  venueName: S.string,
});
export interface CreateSessionInput extends S.Schema.To<typeof CreateSessionInput> {}
export const CreateSessionPayload = S.struct({
  clientId: S.number,
  clientSecret: S.string,
  userIp: S.string,
  maxInstallments: S.number,
  customerCssUrl: S.optional(S.string),
  enableDefaultCss: S.optional(S.boolean),
  paymentRequest: S.struct({
    paymentAmount: Cost,
    paymentNetwork: PaymentNetwork,
    paymentProcess: PaymentProcess,
    paymentCurrencyType: PaymentCurrency,
    paymentDescription: S.string,
    payerName: Name,
    payerPhoneNumber: PhoneNumber,
    autoCapture: S.optional(S.boolean),
    orderId: Order.Id,
    sendSMS: S.optional(S.boolean),
    captureTimeout: S.optional(S.number),
    callbackUrl: S.optional(S.string),
  }),
});
export interface CreateSessionPayload extends S.Schema.To<typeof CreateSessionPayload> {}

export const PaymentResponse = S.struct({
  transactionStatus: S.literal("approved"),
  issuerAuthorizationNumber: AuthorizationNumber,
  cardNumber: CardNumber,
});
interface PaymentResponse extends S.Schema.To<typeof PaymentResponse> {}

export const PaymentResponseOption = pipe(
  S.union(
    S.object,
    S.undefined,
    PaymentResponse,
  ),
  S.transform(
    S.to(S.option(PaymentResponse)),
    O.liftPredicate((n): n is PaymentResponse => Boolean(n && "transactionStatus" in n)),
    O.getOrUndefined as any,
  ),
);

export const CreateSessionData = pipe(
  S.struct({
    session: Session,
    iframeUrl: S.optional(IFrameUrl, { as: "Option" }),
    paymentResponse: PaymentResponseOption,
  }),
);

export const CreateSessionSuccessBody = S.struct({
  success: S.literal(true),
  data: CreateSessionData,
  errors: pipe(S.array(S.never), S.itemsCount(0)),
  apiVersion: S.optional(S.string),
});

export const CreateSessionErrorBody = S.struct({
  apiVersion: S.optional(S.string),
  success: S.literal(false),
  data: S.null,
  errors: S.array(S.struct({
    msg: S.string,
  })),
});

export const CreateSessionSuccess = pipe(
  CreateSessionSuccessBody,
  S.transform(
    S.to(CreateSessionData),
    (res) => res.data,
    (data) => ({
      success: true as const,
      data,
      errors: [],
    }),
  ),
);
export interface CreateSessionSuccess extends S.Schema.To<typeof CreateSessionSuccess> {}
