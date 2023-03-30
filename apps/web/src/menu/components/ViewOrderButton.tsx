import { animated, useTransition } from "@react-spring/web";
import { useTranslations } from "next-intl";
import { toShekel } from "src/core/helpers/content";
import * as Order from "src/menu/hooks/useOrder";

type Props = {
  onClick(): void;
  order: Order.Order;
};

export function ViewOrderButton(props: Props) {
  const { onClick, order } = props;
  const show = Order.isActiveOrder(order);
  const t = useTranslations("menu.Components.ViewOrderButton");
  const transition = useTransition(show, {
    from: { y: 200, opacity: 0 },
    enter: { y: 0, opacity: 1 },
    leave: { y: 200, opacity: 0 },
    reverse: show,
  });

  return transition(
    (styles, show) =>
      show && (
        <animated.button
          style={styles}
          className="flex fixed inset-x-3 bottom-3 w-[calc(100%-24px)] justify-center items-center rounded-md border border-transparent shadow-lg shadow-emerald-300 px-4 py-3 bg-emerald-600 text-base text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:text-sm"
          onClick={onClick}
        >
          <span className="badge badge-outline">{(order as Order.ActiveOrder).totalAmount}</span>
          <span className="inline-block text-left rtl:text-right flex-grow px-4">
            {t("viewOrder")}
          </span>
          <span className="tracking-wider font-light text-emerald-100">
            {toShekel((order as Order.ActiveOrder).totalCost)}
          </span>
        </animated.button>
      ),
  );
}

export default ViewOrderButton;
