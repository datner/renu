import { BlitzPage } from "@blitzjs/auth";
import { Routes } from "@blitzjs/next";
import { invalidateQuery, useMutation, useQuery } from "@blitzjs/rpc";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Locale, OrderState, Prisma } from "database";
import { Modifiers } from "database-helpers";
import { Suspense, useState } from "react";
import { titleFor } from "src/core/helpers/content";
import cancelOrder from "src/orders/mutations/cancelOrder";
import confirmOrder from "src/orders/mutations/confirmOrder";
import deliverOrder from "src/orders/mutations/deliverOrder";
import killOrder from "src/orders/mutations/killOrder";
import getVenueOrders from "src/orders/queries/current/getVenueOrders";

function ConfirmOrders(props: { orderId: number }) {
  const [confirm, { isLoading: isConfirmLoading }] = useMutation(confirmOrder, {
    onSuccess() {
      invalidateQuery(getVenueOrders);
    },
  });
  const [cancel, { isLoading: isCancelLoading }] = useMutation(cancelOrder, {
    onSuccess() {
      invalidateQuery(getVenueOrders);
    },
  });
  return (
    <div className="flex flex-col gap-2">
      <button className="btn btn-success" onClick={() => confirm(props.orderId)}>
        {isConfirmLoading ? <ArrowPathIcon className="animate-spin h-6 w-6" /> : "Confirm"}
      </button>
      <button className="btn btn-error" onClick={() => cancel(props.orderId)}>
        {isCancelLoading ? <ArrowPathIcon className="animate-spin h-6 w-6" /> : "Cancel Order"}
      </button>
    </div>
  );
}

function DeliverOrder(props: { orderId: number }) {
  const [deliver, { isLoading: isDeliverLoading }] = useMutation(deliverOrder, {
    onSuccess() {
      invalidateQuery(getVenueOrders);
    },
  });
  const [cancel, { isLoading: isCancelLoading }] = useMutation(cancelOrder, {
    onSuccess() {
      invalidateQuery(getVenueOrders);
    },
  });
  return (
    <div className="flex flex-col gap-2">
      <button className="btn btn-success" onClick={() => deliver(props.orderId)}>
        {isDeliverLoading ? <ArrowPathIcon className="animate-spin h-6 w-6" /> : "Deliver"}
      </button>
      <button className="btn btn-error" onClick={() => cancel(props.orderId)}>
        {isCancelLoading ? <ArrowPathIcon className="animate-spin h-6 w-6" /> : "Cancel Order"}
      </button>
    </div>
  );
}

function RestoreOrder(props: { orderId: number }) {
  const [confirm, { isLoading: isConfirmLoading }] = useMutation(confirmOrder, {
    onSuccess() {
      invalidateQuery(getVenueOrders);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <button className="btn btn-success" onClick={() => confirm(props.orderId)}>
        {isConfirmLoading ? <ArrowPathIcon className="animate-spin h-6 w-6" /> : "Restore"}
      </button>
    </div>
  );
}

const Orders = () => {
  const [state, setState] = useState<OrderState>(OrderState.Init);

  const handleClick = (state: OrderState) => () => setState(state);

  return (
    <div className="grid place-items-center w-full">
      <div>
        <div className="tabs mx-2">
          <span
            aria-selected={state === OrderState.Init}
            className="tab tab-lifted aria-selected:tab-active"
            onClick={handleClick(OrderState.Init)}
          >
            {OrderState.Init}
          </span>
          <span
            aria-selected={state === OrderState.Unconfirmed}
            className="tab tab-lifted aria-selected:tab-active"
            onClick={handleClick(OrderState.Unconfirmed)}
          >
            {OrderState.Unconfirmed}
          </span>
          <span
            aria-selected={state === OrderState.Confirmed}
            className="tab tab-lifted aria-selected:tab-active"
            onClick={handleClick(OrderState.Confirmed)}
          >
            {OrderState.Confirmed}
          </span>
          <span
            aria-selected={state === OrderState.Delivered}
            className="tab tab-lifted aria-selected:tab-active"
            onClick={handleClick(OrderState.Delivered)}
          >
            {OrderState.Delivered}
          </span>
          <span
            aria-selected={state === OrderState.Cancelled}
            className="tab tab-lifted aria-selected:tab-active"
            onClick={handleClick(OrderState.Cancelled)}
          >
            {OrderState.Cancelled}
          </span>
        </div>
        <Suspense
          fallback={<div className="border -mt-px rounded border-base-300 p-8">Loading...</div>}
        >
          <OrderList state={state} />
        </Suspense>
      </div>
    </div>
  );
};

const title = titleFor(Locale.he);
function OrderList(props: { state: OrderState }) {
  const { state } = props;
  const [{ orders }] = useQuery(getVenueOrders, {
    take: 50,
    where: { state },
    orderBy: { updatedAt: Prisma.SortOrder.asc },
  });

  return (
    <div className="flex flex-col gap-4 border -mt-px rounded border-base-300 p-8">
      {orders.map((order) => (
        <div className="p-2 flex px-6 border rounded shadow">
          <ul key={order.id} className="grow steps steps-vertical">
            {order.items.map((item) => (
              <li key={item.id} data-content={item.quantity} className="step">
                <div>
                  <h4>{title(item.item.content)}</h4>
                  {item.modifiers.map((i) => (
                    <div key={i.id}>
                      {title(i.modifier.config.content)}: {O.getOrNull(
                        O.map(
                          A.findFirst(
                            i.modifier.config.options as unknown as Modifiers.BaseOption[],
                            (o) => o.identifier === i.choice,
                          ),
                          _ => title(_.content),
                        ),
                      )}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {state === OrderState.Init
            ? <ConfirmOrders orderId={order.id} />
            : state === OrderState.Unconfirmed
            ? <ConfirmOrders orderId={order.id} />
            : state === OrderState.Confirmed
            ? <DeliverOrder orderId={order.id} />
            : state === OrderState.Delivered
            ? <RestoreOrder orderId={order.id} />
            : state === OrderState.Cancelled
            ? <RestoreOrder orderId={order.id} />
            : null}
        </div>
      ))}
    </div>
  );
}

const VenuesVenuOrders: BlitzPage = () => (
  <Suspense fallback={<div>loading...</div>}>
    <Orders />
  </Suspense>
);

VenuesVenuOrders.authenticate = { redirectTo: Routes.Authentication() };

export default VenuesVenuOrders;
