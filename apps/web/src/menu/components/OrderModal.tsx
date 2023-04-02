import { useMutation } from "@blitzjs/rpc";
import { absurd, pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as A from "@effect/data/ReadonlyArray";
import { a, useSpring } from "@react-spring/web";
import { useTranslations } from "next-intl";
import { useState } from "react";
import useMeasure from "react-use-measure";
import { Number } from "shared/schema";
import { toShekel } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { useZodParams } from "src/core/hooks/useParams";
import { usePrevious } from "src/core/hooks/usePrevious";
import * as Order from "src/menu/hooks/useOrder";
import { Query } from "src/menu/validations/page";
import sendOrder from "../mutations/sendOrder";
import { FeedbackModal } from "./FeedbackModal";
import { Modal } from "./Modal";
import { OrderModalItem } from "./OrderModalItem";
import Script from "next/script";
import { Branded } from "@effect/data/Brand";

type Props = {
  open?: boolean;
  onClose(): void;
  order: Order.Order;
  dispatch: Order.OrderDispatch;
};

declare global {
  function gamapayInit(
    sessionId: Branded<string, "GamaSession">,
    containerId?: string,
    callbackFunction?: () => void,
  ): void;
}

export function OrderModal(props: Props) {
  const { onClose, open, order, dispatch } = props;
  const t = useTranslations("menu.Components.OrderModal");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const locale = useLocale();
  const { restaurant } = useZodParams(Query);
  const [ref, { height }] = useMeasure();
  const isNoHeight = usePrevious(height) === 0;
  const { h } = useSpring({ h: height, immediate: isNoHeight });
  const [sendOrderMutation, { isLoading, isSuccess }] = useMutation(sendOrder, {
    onSuccess: (url) => {
      if (url instanceof URL) {
        return window.location.assign(url.href);
      }

      // @ts-ignore
      gamapayInit(url, undefined, (a,b,c,d,e) => console.log({a,b,c,d,e}));
    },
  });

  const handleOrder = () => {
    if (Order.isEmptyOrder(order)) return;

    sendOrderMutation({
      locale,
      venueIdentifier: restaurant,
      orderItems: pipe(
        order.items,
        HashMap.map((it) => ({
          comment: it.comment,
          amount: Order.isMultiOrderItem(it) ? it.amount : Number.Amount(1),
          cost: it.cost,
          item: it.item.id,
          modifiers: pipe(
            it.modifiers,
            A.fromIterable,
            A.map(([id, mod]) => {
              if (Order.isOneOf(mod)) {
                return {
                  _tag: "OneOf",
                  id,
                  choice: mod.choice,
                  amount: mod.amount,
                } as const;
              }
              if (Order.isExtras(mod)) {
                return {
                  _tag: "Extras",
                  id,
                  choices: A.fromIterable(mod.choices),
                } as const;
              }

              throw absurd(mod);
            }),
          ),
        })),
        HashMap.values,
        A.fromIterable,
      ),
    });
  };

  const amount = Order.getOrderAmount(order);
  const cost = Order.getOrderCost(order);
  const items = Order.getOrderItems(order);

  const listItems = HashMap.mapWithIndex(
    items,
    (item, key) => <OrderModalItem key={key} hash={key} dispatch={dispatch} orderItem={item} />,
  );

  return (
    <Modal open={open} onClose={onClose}>
      <Script src="https://gpapi.gamaf.co.il/dist/gamapay-bundle.js" />
      <div className="p-3 pb-16 bg-white rounded-t-xl overflow-auto">
        <h3 className="text-2xl rtl:mt-9">{t("yourOrder")}</h3>
        <hr className="w-1/2 mt-1 mb-2" />
        <div>
          <a.div style={{ height: h }}>
            <ul ref={ref} className="divide-y divide-emerald-400">
              {HashMap.values(listItems)}
            </ul>
          </a.div>
          <div className="h-8" />
          <button
            onClick={handleOrder}
            disabled={isLoading || amount === 0 || isSuccess}
            className="btn w-full btn-primary"
          >
            <span className="badge badge-outline badge-ghost">{amount}</span>
            <span className="inline-block flex-grow px-3 text-left rtl:text-right">
              {isLoading ? t("loading") : t("order")}
            </span>
            <span className="tracking-wider font-light">{toShekel(cost)}</span>
          </button>
        </div>
      </div>
      <FeedbackModal
        show={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          window.location.reload();
        }}
      />
    </Modal>
  );
}

export default OrderModal;
