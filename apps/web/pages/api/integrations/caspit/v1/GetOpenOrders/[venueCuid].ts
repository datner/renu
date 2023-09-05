import * as Schema from "@effect/schema/Schema";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import { Context, Data, Duration, Effect, Match, Option, Predicate } from "effect";
import { nanoid } from "nanoid";
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { Database, Order, Venue } from "shared";
import { FullOrder } from "shared/Order/fullOrder";
import { Renu } from "src/core/effect";

// ========== Models ==========

interface NextRequest {
  readonly _: unique symbol;
}

interface NextResponse {
  readonly _: unique symbol;
}

enum DeliveryType {
  Takeout,
  Delivery,
}

enum ChargeType {
  Discount,
  DeliveryPrice,
  Tip,
}

enum PaymentType {
  Cash,
  CreditCard,
  Cibus,
  /** @actual 10Bis */
  Takeout,
}

class MethodUnsupportedError extends Data.TaggedClass("MethodUnsupportedError")<{ supported: string }> {
  toString() {
    return "Method unsupported, use " + this.supported;
  }
  toJSON() {
    return "Method unsupported, use " + this.supported;
  }
}

class UnauthorizedError extends Data.TaggedClass("UnauthorizedError")<{ error: unknown }> {}

class ForbiddenError extends Data.TaggedClass("ForbiddenError")<{}> {}

class BadRequestError extends Data.TaggedClass("BadRequestError")<{}> {}

// ========== Context ==========

const NextRequest = Context.Tag<NextRequest, NextApiRequest>();
const NextResponse = Context.Tag<NextResponse, NextApiResponse>();

// ========== Schemas ==========

const CaspitVariation = Schema.struct({
  code: Schema.string,
  desc: Schema.string,
  price: Schema.number,
  comment: Schema.string,
  quantity: Schema.number,
});

const OrderModifierToCaspitVariation = Schema.transform(
  Order.Modifier.Schema,
  CaspitVariation,
  _ => ({
    comment: "",
    price: _.price,
    quantity: _.amount,
    desc: _.choice,
    code: _.ref, // TODO: get management representation
  }),
  _ =>
    ({
      ref: _.code,
      choice: _.desc,
      amount: _.quantity,
      price: _.price,
      id: -1,
      itemModifierId: -1,
    }) as any,
);

const CaspitItem = Schema.struct({
  code: Schema.string,
  desc: Schema.string,
  price: Schema.number,
  comment: Schema.string,
  quantity: Schema.number,
  variations: Schema.array(CaspitVariation),
});

const CaspitItemTransform = CaspitItem.pipe(
  Schema.omit("variations"),
  Schema.extend(
    Schema.struct({
      variations: Schema.array(OrderModifierToCaspitVariation),
    }),
  ),
);

const OrderItemToCaspitItem = Schema.transform(
  Schema.extend(Order.Item.Schema, Schema.struct({ modifiers: Schema.array(Order.Modifier.Schema) })),
  CaspitItemTransform,
  _ => ({
    variations: _.modifiers,
    price: _.price,
    quantity: _.quantity,
    desc: _.name,
    comment: _.comment,
    code: String(_.itemId),
  }),
  _ =>
    ({
      itemId: Number(_.code),
      comment: _.comment,
      name: _.desc,
      quantity: _.quantity,
      price: _.price,
      orderModifiers: [],
      id: -1,
      orderId: -1,
    }) as any,
);

const CaspitCharge = Schema.struct({
  type: Schema.enums(ChargeType),
  desc: Schema.string,
  amount: Schema.number,
});

const CaspitCustomer = Schema.struct({
  id: Schema.string,
  firstName: Schema.string,
  lastName: Schema.string,
  email: Schema.string,
  phone: Schema.string,
});

const CaspitAddress = Schema.struct({
  city: Schema.string,
  street: Schema.string,
  number: Schema.string,
  floor: Schema.string,
  comment: Schema.string,
});

const CaspitPayment = Schema.struct({
  type: Schema.enums(PaymentType),
  amount: Schema.number,
  confirmationNumber: Schema.string, /** basically txId */
});

const CaspitOrder = Schema.struct({
  orderId: Schema.string,
  items: Schema.array(CaspitItem),
  charges: Schema.array(CaspitCharge),
  comment: Schema.string,
  orderTime: Schema.number,
  deliveryTime: Schema.number,
  customer: CaspitCustomer,
  address: CaspitAddress,
  deliveryType: Schema.enums(DeliveryType),
  payments: Schema.array(CaspitPayment),
  takeoutSets: Schema.number,
  orderTotal: Schema.number,
  orderSubTotal: Schema.number,
});

const CaspitOrderTransform = CaspitOrder.pipe(
  Schema.omit("items"),
  Schema.extend(
    Schema.struct({
      items: Schema.array(OrderItemToCaspitItem),
    }),
  ),
);

const OrderToCaspitOrder = Schema.transform(
  Schema.to(FullOrder),
  CaspitOrderTransform,
  _ => ({
    items: _.items,
    orderId: String(_.id),
    comment: "Sent from Renu",
    payments: [{ amount: _.totalCost, type: PaymentType.CreditCard, confirmationNumber: Option.getOrThrow(_.txId) }],
    charges: [],
    customer: {
      id: nanoid(),
      email: "",
      phone: Option.map(_.clearingExtra, _ => _.phoneNumber).pipe(Option.getOrThrow),
      lastName: "Renu",
      firstName: Option.getOrElse(_.customerName, () => "Customer"),
    },
    address: {
      number: "",
      comment: "",
      city: "",
      floor: "",
      street: "",
    },
    takeoutSets: 0,
    deliveryType: DeliveryType.Takeout,
    orderTotal: _.totalCost,
    orderSubTotal: _.totalCost,
    orderTime: _.createdAt.getMilliseconds(),
    deliveryTime: Duration.millis(_.createdAt.getMilliseconds()).pipe(Duration.sum("10 minutes"), Duration.toMillis),
  }),
  _ => {
    throw "I don't want to write the other way around";
  },
);

// ========== Validators ==========

const authorize = (req: NextApiRequest) =>
  Effect.fromNullable(req.headers.authorization).pipe(
    Effect.mapError(() => new UnauthorizedError({ error: "No authorization header found" })),
    Effect.map(_ => crypto.createHash("md5").update(_).digest("hex")),
    Effect.flatMap(
      Effect.serviceFunctionEffect(Database.Database, db => hash =>
        // TODO: move this to a Request
        Effect.promise(
          () => db.apiKey.findUnique({ where: { hash } }),
        )),
    ),
    Effect.filterOrFail(Predicate.isNotNull, () => new UnauthorizedError({ error: "Unrecognized" })),
    Effect.as(req),
  );

const urlParamSchema = <I extends Record<string, string | string[]>, A>(schema: Schema.Schema<I, A>) => {
  const parse = Schema.parse(schema);
  return Effect.flatMap(NextRequest, _ => parse(_.query));
};

const bodySchema = <I extends Record<string, string | string[]>, A>(schema: Schema.Schema<I, A>) => {
  const parse = Schema.parse(schema);
  return Effect.flatMap(NextRequest, _ => parse(_.body));
};

const VenueParam = Schema.struct({
  venueCuid: Schema.string,
});

enum OrderStatus {
  Accepted = 1,
  InPreperation,
  Ready,
  Delivered,
}

const VenueUpdatePayload = Schema.struct({
  orderId: Order.CUID,
  status: Schema.NumberFromString.pipe(
    Schema.compose(Schema.enums(OrderStatus)),
  ),
  data: Schema.string,
});

// ========== Handlers ==========

const handlers = Match.type<"GET" | "POST" | string>().pipe(
  Match.when(
    "GET",
    () =>
      urlParamSchema(VenueParam).pipe(
        Effect.map(_ => _.venueCuid),
        Effect.flatMap(Venue.service.getByCuid),
        Effect.flatMap(_ => _.orders),
        Effect.flatMap(Effect.forEach(_ => Order.Order.full(_.cuid))),
        Effect.flatMap(Schema.decode(Schema.array(OrderToCaspitOrder))),
        Effect.flatMap(Schema.encode(Schema.array(CaspitOrder))),
        Effect.flatMap(_ => Effect.map(NextResponse, res => res.json(_)) // should be 201 :|
        ),
      ),
  ),
  Match.when("POST", () =>
    Effect.gen(function*(_) {
      const order = yield* _(Order.service.tag);
      const { venueCuid } = yield* _(urlParamSchema(VenueParam));
      const venue = yield* _(Venue.service.getByCuid(venueCuid));
      const { status, orderId } = yield* _(bodySchema(VenueUpdatePayload));
      const res = yield* _(NextResponse);

      if (status > OrderStatus.Accepted) {
        res.status(500).json({ error: "Unsupported. Why 500 though? I didn't error. You did...." }); // why???
        yield* _(Effect.fail(new BadRequestError()));
      }

      yield* _(
        order.getByCuid(orderId),
        Effect.filterOrFail(_ => _.venueId === venue.id, () => new ForbiddenError()),
        Effect.flatMap(_ => order.setOrderState(_.id, "Confirmed")),
      );

      res.status(200); // Should be 201. Come on.
    })),
  Match.orElse(() => Effect.fail(new MethodUnsupportedError({ supported: "GET,POST" }))),
);

const handler = async (request: NextApiRequest, res: NextApiResponse) =>
  NextRequest.pipe(
    Effect.flatMap(authorize),
    Effect.flatMap(_ => handlers(_.method!)),
    Effect.catchTags({
      MethodUnsupportedError: (_) =>
        Effect.sync(() =>
          res.status(500).json({
            error:
              `Actually this is a 400 - Bad Request. Why do you ask me to send 500? I didn't error. I'm fine over here.
Error:
${_}
`,
          })
        ),
      ParseError: (_) =>
        Effect.sync(() =>
          res.status(500).json({
            error:
              `Actually this is a 400 - Bad Request. Why do you ask me to send 500? I didn't error. I'm fine over here.

Error:
${TreeFormatter.formatErrors(_.errors)}
`,
          })
        ),
      ForbiddenError: (_) =>
        Effect.sync(() =>
          res.status(500).json({
            error: "I know it says 500. But it's not. It's 403 - Forbidden. You're not allowed to do that.",
          })
        ),
      UnauthorizedError: (_) =>
        Effect.sync(() =>
          res.status(500).json({
            error:
              "Not 500. I'm doing fine thanks. But you got a 401 Unauthorized... Did you forget to send the API key? Or maybe sent the wrong one?",
          })
        ),
    }),
    Effect.catchAll(() =>
      Effect.sync(() =>
        res.status(500).json({
          error: "Unsupported. Why 500 though? I didn't error. I'm failing expectedly in response to your request.",
        })
      )
    ),
    Effect.provideSomeContext(
      Context.empty().pipe(
        Context.add(NextRequest, request),
        Context.add(NextResponse, res),
      ),
    ),
    Renu.runPromise$,
  );

export default handler;
