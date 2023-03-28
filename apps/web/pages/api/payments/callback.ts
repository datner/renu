import { PayPlusCallback } from "src/payments/payplus";
import { pipe } from "@effect/data/Function";
import * as E from "@effect/data/Either";
import * as Effect from "@effect/io/Effect";
import * as Str from "@effect/data/String";
import * as P from "@effect/schema/Parser";
import { NextApiRequest, NextApiResponse } from "next";
import db, { OrderState } from "db";
import {
  prismaError,
} from "src/core/helpers/prisma";
import { notify } from "integrations/telegram/sendMessage";
import { Format } from "telegraf";
import * as Management from "@integrations/management";
import { fullOrderInclude } from "@integrations/core/management";
import { Renu } from "src/core/effect";

const handler = async (request: NextApiRequest, res: NextApiResponse) =>
  pipe(
    Effect.succeed(request),
    Effect.filterOrDieMessage(
      (req) => Str.toLowerCase(req.method || "") === "post",
      "this endpoint only received POST messages",
    ),
    Effect.map((req) => req.body),
    Effect.flatMap(P.parseEffect(PayPlusCallback)),
    Effect.filterOrDieMessage(
      (ppc) => ppc.transaction.status_code === "000",
      "payplus returned a failed transaction. Why?",
    ),
    Effect.flatMap((ppc) =>
      pipe(
        Effect.gen(function* ($) {
          let order = yield* $(
            Effect.attemptCatchPromise(
              () =>
                db.order.update({
                  where: { id: ppc.transaction.more_info },
                  data: { txId: ppc.transaction.uid },
                  include: fullOrderInclude,
                }),
              prismaError("Order"),
            ),
          );

          const either = yield* $(Effect.either(Management.reportOrder(order)));

          if (E.isLeft(either)) {
            const e = either.left;
            const orderId = ppc.transaction.more_info;
            const venueId = ppc.transaction.more_info_1;
            const pre = Format.pre("none");
            const message = "error" in e && e.error instanceof Error
              ? `Provider Payplus reported the following error:\n ${
                pre(e.error.message)
              }`
              : `Please reach out to Payplus support for further details.`;

            yield* $(
              notify(
                ` Order ${orderId} of venue ${venueId} could not be submitted to management.\n\n${message}`,
              ),
            );
          }

          order = yield* $(
            Effect.attemptCatchPromise(
              () =>
                db.order.update({
                  where: { id: order.id },
                  data: { state: OrderState.Unconfirmed },
                  include: fullOrderInclude,
                }),
              prismaError("Order"),
            ),
          );

          const state = yield* $(Management.getOrderStatus(order));

          return yield* $(
            Effect.attemptCatchPromise(
              () =>
                db.order.update({
                  where: { id: order.id },
                  data: { state },
                  include: fullOrderInclude,
                }),
              prismaError("Order"),
            ),
          );
        }),
        Effect.provideServiceEffect(
          Management.Integration,
          Effect.attemptCatchPromise(
            () =>
              db.managementIntegration.findUniqueOrThrow({
                where: { venueId: ppc.transaction.more_info_1 },
              }),
            prismaError("ManagementIntegration"),
          ),
        ),
      )
    ),
    Effect.catchAll((e) =>
      notify(
        Format.fmt(
          `Error in payment callback\n\n`,
          Format.pre("none")(e instanceof Error ? e.message : e._tag),
        ),
      )
    ),
    Effect.match(
      () => res.status(400).json({ success: false }),
      () => res.status(200).json({ success: true }),
    ),
    Renu.runPromise$,
  );

export default handler;
