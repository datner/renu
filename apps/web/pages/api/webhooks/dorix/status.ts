import * as Schema from "@effect/schema/Schema";
import { ORDER_STATUS } from "@integrations/dorix/types";
import { OrderState } from "database";
import { Effect, Match } from "effect";
import { NextApiRequest, NextApiResponse } from "next";
import { Order } from "shared";
import { Renu } from "src/core/effect";

const DorixSuccess = Schema.struct({
  endpoint: Schema.string,
  action: Schema.string,
  order: Schema.struct({
    status: Schema.enums(ORDER_STATUS),
    id: Schema.string,
    externalId: Schema.NumberFromString.pipe(Schema.compose(Order.Id)),
    source: Schema.literal("RENU"),
    metadata: Schema.record(Schema.string, Schema.string),
    estimatedTime: Schema.number,
  }),
  branch: Schema.struct({
    id: Schema.string,
    name: Schema.string,
  }),
});

const DorixFailure = Schema.struct({
  endpoint: Schema.string,
  action: Schema.string,
  order: Schema.struct({
    status: Schema.enums(ORDER_STATUS),
    externalId: Schema.NumberFromString,
    source: Schema.literal("RENU"),
    metadata: Schema.record(Schema.string, Schema.any),
  }),
  branch: Schema.struct({
    id: Schema.string,
  }),
  error: Schema.optional(Schema.struct({
    message: Schema.string,
    stack: Schema.string,
  })),
});

const DorixResponse = Schema.union(
  DorixSuccess.pipe(Schema.attachPropertySignature("_tag", "DorixSuccess")),
  DorixFailure.pipe(Schema.attachPropertySignature("_tag", "DorixFailure")),
);

const getNextState = Match.type<Schema.Schema.To<typeof DorixSuccess>["order"]["status"]>().pipe(
  Match.whenOr("FAILED", "UNREACHABLE", _ => OrderState.Cancelled),
  Match.when("AWAITING_TO_BE_RECEIVED", _ => OrderState.Unconfirmed),
  Match.orElse(_ => OrderState.Confirmed),
);

const handler = (req: NextApiRequest, res: NextApiResponse) =>
  Effect.succeed(req).pipe(
    Effect.filterOrFail(req => req.method?.toUpperCase() === "POST", () =>
      new Error("this endpoint only supports POST requests")),
    Effect.map(_ =>
      _.body
    ),
    Effect.flatMap(Schema.parse(DorixResponse)),
    Effect.filterOrFail(Schema.is(DorixSuccess), _ => _ as Schema.Schema.To<typeof DorixFailure>),
    Effect.flatMap(_ => Order.setOrderState(_.order.externalId, getNextState(_.order.status))),
    Effect.match({
      onFailure: (e) => res.status(500).json(e),
      onSuccess: () => res.status(200).json({ success: true }),
    }),
    Renu.runPromise$,
  );

export default handler;
