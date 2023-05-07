import { invoke, useMutation } from "@blitzjs/rpc";
import { Branded } from "@effect/data/Brand";
import { absurd, pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as A from "@effect/data/ReadonlyArray";
import * as Exit from "@effect/io/Exit";
import { useLocalStorage } from "@mantine/hooks";
import { a, useSpring } from "@react-spring/web";
import { useTranslations } from "next-intl";
import Script from "next/script";
import { useState } from "react";
import useMeasure from "react-use-measure";
import { Order, Venue } from "shared";
import { Number } from "shared/schema";
import { toShekel } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { usePrevious } from "src/core/hooks/usePrevious";
import * as OrderState from "src/menu/hooks/useOrder";
import confirmGamaTransaction from "../mutations/confirmGamaTransaction";
import sendOrder from "../mutations/sendOrder";
import { FeedbackModal } from "./FeedbackModal";
import { Modal } from "./Modal";
import { useOrderContext } from "./OrderContext";
import { OrderModalItem } from "./OrderModalItem";
import { ErrorModal } from "./ErrorModal";

type Props = {
  open?: boolean;
  venueId: Venue.Id;
  onClose(): void;
};

declare global {
  function gamapayInit(
    sessionId: Branded<string, "GamaSession">,
    containerId?: string,
    callbackFunction?: (payload: { url: false; confirmation: string }) => void,
  ): void;
}

export function OrderModal(props: Props) {
  const { onClose, open, venueId } = props;
  const t = useTranslations("menu.Components.OrderModal");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false)
  const locale = useLocale();
  const [{ order }, dispatch] = useOrderContext();
  const [ref, { height }] = useMeasure();
  const isNoHeight = usePrevious(height) === 0;
  const { h } = useSpring({ h: height, immediate: isNoHeight });
  const [phoneNumber] = useLocalStorage({ key: "phone-number" });
  const [sendOrderMutation, { isLoading, isSuccess, reset }] = useMutation(sendOrder, {
    onSuccess: (_) => {
      reset();
      gamapayInit(_, undefined, ({ confirmation }) => invoke(confirmGamaTransaction, { jwt: confirmation }));
    },
    onError: () => {
      setErrorOpen(true)
    }
  });

  const handleOrder = () => {
    if (OrderState.isEmptyOrder(order)) return;

    sendOrderMutation({
      locale,
      clearingExtra: Order.Clearing.Extra("Gama")({ phoneNumber }),
      managementExtra: Order.Management.Extra("Presto")({ phoneNumber }),
      venueId,
      orderItems: pipe(
        order.items,
        HashMap.map((it) => ({
          comment: it.comment,
          amount: OrderState.isMultiOrderItem(it) ? it.amount : Number.Amount(1),
          cost: it.cost,
          item: it.item.id,
          modifiers: pipe(
            it.modifiers,
            A.fromIterable,
            A.map(([modifier, mod]) => {
              if (OrderState.isOneOf(mod)) {
                return {
                  _tag: "OneOf",
                  modifier,
                  choice: mod.choice,
                  amount: mod.amount,
                } as const;
              }
              if (OrderState.isExtras(mod)) {
                return {
                  _tag: "Extras",
                  modifier,
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

  const amount = OrderState.getOrderAmount(order);
  const cost = OrderState.getOrderCost(order);
  const items = OrderState.getOrderItems(order);

  const listItems = HashMap.mapWithIndex(
    items,
    (item, key) => <OrderModalItem key={key} hash={key} dispatch={dispatch} orderItem={item} />,
  );

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Script src="https://gpapidemo.gamaf.co.il/dist/gamapay-bundle-demo.js" />
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
      </Modal>
      <FeedbackModal
        show={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          window.location.reload();
        }}
      />
      <ErrorModal show={errorOpen} onClose={() => setErrorOpen(false)} />
    </>
  );
}

export default OrderModal;
