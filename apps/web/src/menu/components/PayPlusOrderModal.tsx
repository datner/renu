import { Routes } from "@blitzjs/next";
import { useMutation, useQuery } from "@blitzjs/rpc";
import { absurd, pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as A from "@effect/data/ReadonlyArray";
import * as Match from "@effect/match";
import { TaggedEnum, taggedEnum } from "@effect/match/TaggedEnum";
import { LoadingOverlay } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { a, useSpring } from "@react-spring/web";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import useMeasure from "react-use-measure";
import { Order, Venue } from "shared";
import { Number } from "shared/schema";
import { toShekel } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { usePrevious } from "src/core/hooks/usePrevious";
import * as OrderState from "src/menu/hooks/useOrder";
import getPayplusUrl from "src/orders/mutations/getPayplusUrl";
import getOrderStatus from "src/orders/queries/getOrderStatus";
import sendOrder from "../mutations/sendOrder";
import { Modal } from "./Modal";
import { useOrderContext } from "./OrderContext";
import { OrderModalItem } from "./OrderModalItem";

type Props = {
  open?: boolean;
  venueId: Venue.Id;
  onClose(): void;
};

const Payment = taggedEnum<{
  Init: {};
  Open: { url: string };
  Closed: { url: string };
}>();

const PaymentInit = Payment("Init");
const PaymentOpen = Payment("Open");
const PaymentClosed = Payment("Closed");

const matchPayment = Match.typeTags<Payment>();
const matchUrl = <A, B>(f: (url: string) => A, orElse: () => B) =>
  matchPayment({
    Open: _ => f(_.url),
    Closed: _ => f(_.url),
    Init: orElse,
  });

type Payment = TaggedEnum.Infer<typeof Payment>;

export function PayPlusOrderModal(props: Props) {
  const { onClose, open, venueId } = props;
  const t = useTranslations("menu.Components.OrderModal");
  const locale = useLocale();
  const [{ order }, dispatch] = useOrderContext();
  const [ref, { height }] = useMeasure();
  const isNoHeight = usePrevious(height) === 0;
  const { h } = useSpring({ h: height, immediate: isNoHeight });
  const [phoneNumber] = useLocalStorage({ key: "phone-number" });
  const [getUrl, url] = useMutation(getPayplusUrl);
  const [payment, setPayment] = useState<Payment>(PaymentInit());
  const [sendOrderMutation, { isLoading, isSuccess, data: newOrder }] = useMutation(sendOrder);

  const handleOrder = async () => {
    if (payment._tag !== "Init") {
      setPayment(PaymentOpen(payment));
    }
    if (OrderState.isEmptyOrder(order)) return;

    const newOrder = await sendOrderMutation({
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

    const url = await getUrl({ venueId: newOrder.venueId, orderId: newOrder.id });
    setPayment(PaymentOpen({ url }));
  };

  const amount = OrderState.getOrderAmount(order);
  const cost = OrderState.getOrderCost(order);
  const items = OrderState.getOrderItems(order);
  const valid = OrderState.getOrderValidity(order);

  const listItems = HashMap.map(
    items,
    (item, key) => <OrderModalItem key={key} hash={key} dispatch={dispatch} orderItem={item} />,
  );

  return (
    <>
      <Modal open={open} onClose={onClose}>
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
        open={payment._tag === "Open"}
        onClose={() => {
          if (payment._tag === "Init") {
            return;
          }
          setPayment(PaymentClosed(payment));
        }}
      >
        <div
          id="payment"
          className="pb-16 bg-white rounded-t-xl overflow-auto [&_iframe]:h-[600px] [&_iframe]:w-screen"
        >
          {matchUrl(
            url => <iframe src={url} />,
            () => null,
          )(payment)}
        </div>
      </Modal>
      <LoadingOverlay pos="fixed" visible={isLoading || url.isLoading} />
      <Suspense fallback={null}>
        {newOrder && <WaitForPayment id={newOrder.id} />}
      </Suspense>
    </>
  );
}

const WaitForPayment = (props: { id: number }) => {
  const { id } = props;
  const router = useRouter();
  useQuery(getOrderStatus, id, {
    refetchInterval: (state) => {
      if (!state || ["PaidFor", "Confirmed", "Unconfirmed"].includes(state)) {
        return 700;
      }
      return false;
    },
    onSuccess: (state) => {
      switch (state) {
        case "Init":
          return; /* wait.. */

        case "Dead":
        case "PaidFor":
        case "Unconfirmed":
        case "Confirmed":
        case "Cancelled":
        case "Refunded":
        case "Delivered":
          return router.push(Routes.OrderId({ id }));

        default: {
          throw absurd(state);
        }
      }
    },
  });

  return null;
};

export default PayPlusOrderModal;
