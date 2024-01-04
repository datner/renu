import * as Models from "database";
import { Data, Effect, Request, RequestResolver } from "effect";
import { Database } from "../../Database";
import * as Order from "../order";

export class SetOrderStateError extends Data.TaggedClass("SetOrderStateError")<{ error: unknown }> {}

export interface SetOrderState extends Request.Request<SetOrderStateError, Models.Order> {
  readonly _tag: "Order.SetOrderState";
  readonly id: Order.Id;
  readonly state: Models.OrderState;
}

export const SetOrderState = Request.tagged<SetOrderState>("Order.SetOrderState");

export const SetOrderStateResolver = RequestResolver.contextFromEffect(
  RequestResolver.fromEffect(
    Effect.serviceFunctionEffect(
      Database,
      db => (req: SetOrderState) =>
        Effect.tryPromise({
          try: () => db.order.update({ where: { id: req.id }, data: { state: req.state } }),
          catch: (error) => new SetOrderStateError({ error }),
        }),
    ),
  ),
);

export const setOrderState = (id: Order.Id, state: Models.OrderState) =>
  Effect.request(
    SetOrderState({ id, state }),
    SetOrderStateResolver,
  );
