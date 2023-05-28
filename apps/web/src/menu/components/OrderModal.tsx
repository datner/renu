import { Routes } from "@blitzjs/next";
import { useMutation } from "@blitzjs/rpc";
import { Branded } from "@effect/data/Brand";
import * as Data from "@effect/data/Data";
import { absurd, pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as A from "@effect/data/ReadonlyArray";
import { LoadingOverlay } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { a, useSpring } from "@react-spring/web";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { Order, Venue } from "shared";
import { Number } from "shared/schema";
import { toShekel } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { usePrevious } from "src/core/hooks/usePrevious";
import * as OrderState from "src/menu/hooks/useOrder";
import confirmGamaTransaction from "../mutations/confirmGamaTransaction";
import sendOrder from "../mutations/sendOrder";
import { ErrorModal } from "./ErrorModal";
import { Modal } from "./Modal";
import { useOrderContext } from "./OrderContext";
import { OrderModalItem } from "./OrderModalItem";

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

class NoPayment extends Data.TaggedClass("NoPayment")<{}> { }
class PaymentClosed extends Data.TaggedClass("PaymentClosed")<{ session: Branded<string, "GamaSession"> }> { }
class PaymentOpen extends Data.TaggedClass("PaymentOpen")<{ session: Branded<string, "GamaSession"> }> { }

type Payment = NoPayment | PaymentClosed | PaymentOpen;

export function OrderModal(props: Props) {
  const { onClose, open, venueId } = props;
  const t = useTranslations("menu.Components.OrderModal");
  const [errorOpen, setErrorOpen] = useState(false);
  const locale = useLocale();
  const [{ order }, dispatch] = useOrderContext();
  const [ref, { height }] = useMeasure();
  const isNoHeight = usePrevious(height) === 0;
  const { h } = useSpring({ h: height, immediate: isNoHeight });
  const [phoneNumber] = useLocalStorage({ key: "phone-number" });
  const router = useRouter();
  const [confirmTx, tx] = useMutation(confirmGamaTransaction, {
    onSuccess() {
      router.push(Routes.OrderSuccess());
    },
  });
  const [payment, setPayment] = useState<Payment>(new NoPayment());
  const [sendOrderMutation, { isLoading, isSuccess, reset }] = useMutation(sendOrder, {
    onSuccess: (_) => {
      setPayment(new PaymentOpen({ session: _ }));
      reset();
    },
    onError: () => {
      setErrorOpen(true);
    },
  });

  useEffect(() => {
    const handlePayload = ({ data }: any) => {
      if (data.action === "_gamapay_success") {
        confirmTx({ jwt: data.payload.confirmation });
        setPayment(new NoPayment());
      }
    };

    if (payment._tag === "PaymentOpen") {
      gamapayInit(payment.session, "payment");
    }

    window.addEventListener("message", handlePayload);
    return () => {
      window.removeEventListener("message", handlePayload);
    };
  }, [payment, confirmTx]);

  const handleOrder = () => {
    if (payment._tag !== "NoPayment") {
      setPayment(new PaymentOpen(payment));
    }
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
  const valid = OrderState.getOrderValidity(order)

  const listItems = HashMap.mapWithIndex(
    items,
    (item, key) => <OrderModalItem key={key} hash={key} dispatch={dispatch} orderItem={item} />,
  );

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Script src="https://gpapi.gamaf.co.il/dist/gamapay-bundle.js" />
        <div className="pb-16 pt-3 bg-white rounded-t-xl overflow-auto">
          <h3 className="px-3 text-2xl rtl:mt-9">{t("yourOrder")}</h3>
          <div className="divider w-1/2 mt-1 mb-2" />
          <div className="flex flex-col">
            <a.div style={{ height: h }}>
              <ul ref={ref}>
                {HashMap.values(listItems)}
              </ul>
            </a.div>
            <div className="h-8" />
            <button
              onClick={handleOrder}
              disabled={isLoading || amount === 0 || isSuccess || !valid}
              className="btn btn-primary grow px-3 mx-3"
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
      <Modal
        open={payment._tag === "PaymentOpen"}
        onClose={() => {
          if (payment._tag === "NoPayment") {
            return;
          }
          setPayment(new PaymentClosed(payment));
        }}
      >
        <div
          id="payment"
          className="pb-16 bg-white rounded-t-xl overflow-auto [&_iframe]:h-[600px] [&_iframe]:w-screen"
        >
        </div>
      </Modal>
      <ErrorModal show={errorOpen} onClose={() => setErrorOpen(false)} />
      <LoadingOverlay pos="fixed" visible={isLoading || tx.isLoading} />
    </>
  );
}

export default OrderModal;
