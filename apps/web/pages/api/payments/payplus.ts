import * as Schema from "@effect/schema/Schema";
import { Effect, String } from "effect";
import { notify } from "integrations/telegram/sendMessage";
import { NextApiRequest, NextApiResponse } from "next";
import { Order } from "shared";
import { Renu } from "src/core/effect";
import { PayPlusCallback } from "src/payments/payplus";
import { Format } from "telegraf";

const handler = async (request: NextApiRequest, res: NextApiResponse) =>
  Effect.succeed(request).pipe(
    Effect.filterOrDieMessage(
      (req) => String.toLowerCase(req.method || "") === "post",
      "this endpoint only received POST messages",
    ),
    Effect.map((req) => req.body),
    Effect.flatMap(Schema.parse(PayPlusCallback)),
    Effect.filterOrDieMessage(
      (ppc) => ppc.transaction.status_code === "000",
      "payplus returned a failed transaction. Why?",
    ),
    Effect.flatMap(_ => Order.setTransactionId(_.transaction.more_info, _.transaction.uid)),
    Effect.tapDefect((e) =>
      notify(
        Format.fmt(
          `Error in payment callback\n\n`,
          Format.pre("json")(JSON.stringify(e, null, 2)),
        ),
      )
    ),
    Effect.match({
      onFailure: () => res.status(400).json({ success: false }),
      onSuccess: () => res.status(200).json({ success: true }),
    }),
    Renu.runPromise$,
  );

export default handler;
