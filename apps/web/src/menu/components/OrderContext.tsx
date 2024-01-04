import * as O from "effect/Option";
import { createContext, ReactNode, useContext, useMemo } from "react";
import * as Order from "src/menu/hooks/useOrder";

export const orderContext = createContext<Order.State>(
  Order.State({ order: Order.EmptyOrder(), activeItem: O.none() }),
);

export const orderDispatchContext = createContext<Order.OrderDispatch>((_) => {
  throw new Error("OrderContext was not provided");
});

export const useOrderDispatch = () => useContext(orderDispatchContext);
export const useOrderState = () => useContext(orderContext);

export const useOrderContext = () => {
  const d = useOrderDispatch();
  const s = useOrderState();
  return useMemo(() => [s, d] as const, [s, d]);
};

export const OrderContext = ({ children }: { children?: ReactNode }) => {
  const [state, dispatch] = Order.useOrder();

  return (
    <orderDispatchContext.Provider value={dispatch}>
      <orderContext.Provider value={state}>
        {children}
      </orderContext.Provider>
    </orderDispatchContext.Provider>
  );
};
