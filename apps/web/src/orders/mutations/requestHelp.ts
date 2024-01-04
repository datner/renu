import { resolver } from "@blitzjs/rpc";
import * as Effect from "effect/Effect";
import * as O from "effect/Option";
import * as Telegram from "integrations/telegram/sendMessage";
import { Order } from "shared";
import { Renu } from "src/core/effect";
import { Format } from "telegraf";

const requestHelp = resolver.pipe(
  (_, ctx) => ctx.session.orderId,
  O.fromNullable,
  Effect.flatMap(Order.getById),
  Effect.flatMap(o =>
    Telegram.notify(
      Format.join(
        [
          Format.bold("❗❗❗❗❗❗ ATTENTION ❗❗❗❗❗❗"),
          "\n\n",
          `Order ${o.id} from venue ${o.venueId} has reported a failure and requesting help!`,
          "\n\n",
          "The following is the order JSON: \n",
          Format.pre("json")(JSON.stringify(o, null, 2)),
        ],
      ),
    )
  ),
  Effect.asUnit,
  Renu.runPromise$,
);

export default requestHelp;
