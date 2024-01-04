import * as Models from "database";
import { Data, Request } from "effect";
import * as Order from "../order";

export class SetOrderTransactionIdError extends Data.TaggedClass("SetOrderTransactionIdError")<{}> {}

export interface SetOrderTransactionId extends Request.Request<SetOrderTransactionIdError, Models.Order> {
  readonly _tag: "SetOrderTransactionId";
  readonly id: Order.Id;
  readonly transactionId: Order.TxId;
}

export const SetOrderTransactionId = Request.tagged<SetOrderTransactionId>("SetOrderTransactionId");
