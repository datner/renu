import * as Data from "@effect/data/Data";
import * as Effect from "@effect/io/Effect";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Models from "database";
import { Database } from "../../Database";
import * as Order from "../order";

export class SetOrderStateError extends Data.TaggedClass("SetOrderStateError")<{ error: unknown }> {}

export interface SetOrderState extends Request.Request<SetOrderStateError, Models.Order> {
  readonly _tag: "SetOrderState";
  readonly id: Order.Id;
  readonly state: Models.OrderState;
}

export const SetOrderState = Request.tagged<SetOrderState>("SetOrderState");

export const SetOrderStateResolver = RequestResolver.contextFromEffect(
  RequestResolver.fromFunctionEffect(
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
