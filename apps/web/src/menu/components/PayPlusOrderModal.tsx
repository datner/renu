import { Routes } from "@blitzjs/next";
import { useMutation, useQuery } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { LoadingOverlay } from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { a, useSpring } from "@react-spring/web";
import { absurd, Data, HashMap, Match, Option, pipe, ReadonlyArray as A } from "effect";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { Order, Venue } from "shared";
import { Number } from "shared/schema";
import { toShekel } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { usePrevious } from "src/core/hooks/usePrevious";
import * as OrderState from "src/menu/hooks/useOrder";
import getPayplusUrl from "src/orders/mutations/getPayplusUrl";
import getOrderStatus from "src/orders/queries/getOrderStatus";
import getVenueClearingIntegration from "src/venues/queries/getVenueClearingIntegration";
import { useVenue } from "../hooks/useVenue";
import sendOrder from "../mutations/sendOrder";
import { Modal } from "./Modal";
import { useOrderContext, useOrderState } from "./OrderContext";
import { OrderModalItem } from "./OrderModalItem";

const LazyPhoneModal = dynamic(() => import("src/menu/components/PhoneModal").then(_ => _.PhoneModal));

type Props = {
  open?: boolean;
  venueId: Venue.Id;
  onClose(): void;
};

type Payment = Data.TaggedEnum<{
  Init: {};
  Open: { url: string };
  Closed: { url: string };
}>;
const Payment = Data.taggedEnum<Payment>();

const matchPayment = Match.typeTags<Payment>();
const matchUrl = <A, B>(f: (url: string) => A, orElse: () => B) =>
  matchPayment({
    Open: _ => f(_.url),
    Closed: _ => f(_.url),
    Init: orElse,
  });

const decodeClearing = Schema.decodeSync(Schema.option(Venue.Clearing.ClearingIntegration));

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
  const [payment, setPayment] = useState<Payment>(Payment.Init());
  const [sendOrderMutation, { isLoading, data: existingOrder }] = useMutation(sendOrder);

  useEffect(() => {
    setPayment(Payment.Init());
  }, [order]);

  const handleOrder = async () => {
    if (payment._tag !== "Init") {
      return setPayment(Payment.Open(payment));
    }
    if (OrderState.isEmptyOrder(order)) return;

    const newOrder = await sendOrderMutation({
      locale,
      // TODO: change this
      clearingExtra: Order.Clearing.Extra.Gama({ phoneNumber }),
      managementExtra: Order.Management.Extra.Presto({ phoneNumber }),
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
    setPayment(Payment.Open({ url }));
  };

  const amount = OrderState.getOrderAmount(order);
  const items = OrderState.getOrderItems(order);
  const valid = OrderState.getOrderValidity(order);

  const listItems = HashMap.map(
    items,
    (item, key) => <OrderModalItem key={key} hash={key} dispatch={dispatch} orderItem={item} />,
  );

  const venue = useVenue();

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Script src="https://payments.payplus.co.il/statics/applePay/script.js" />
        <div className="pb-16 pt-3 bg-white rounded-t-xl overflow-auto">
          <h3 className="px-3 text-2xl rtl:mt-9">{t("yourOrder")}</h3>
          <div className="divider w-1/2 mt-1 mb-2" />
          <div className="flex flex-col">
            <a.div style={{ height: h }}>
              <ul ref={ref}>
                {HashMap.values(listItems)}
                <Suspense>
                  <ServiceCharge id={venueId} />
                </Suspense>
              </ul>
            </a.div>
            <div className="h-8" />
            <button
              onClick={handleOrder}
              disabled={isLoading || amount === 0 || !valid || venue.identifier === "tabun"}
              className="btn btn-primary grow px-3 mx-3"
            >
              <span className="badge badge-outline badge-ghost">{amount}</span>
              <span className="inline-block flex-grow px-3 text-left rtl:text-right">
                {isLoading ? t("loading") : t("order")}
              </span>
              <span className="tracking-wider font-light">
                <Suspense fallback={"..."}>
                  <Cost id={venueId} />
                </Suspense>
              </span>
            </button>
          </div>
        </div>
        <LazyPhoneModal />
      </Modal>
      <Modal
        open={payment._tag === "Open"}
        onClose={() => {
          if (payment._tag === "Init") {
            return;
          }
          setPayment(Payment.Closed(payment));
        }}
      >
        <div
          id="payment"
          className="pb-16 bg-white rounded-t-xl overflow-auto [&_iframe]:h-[600px] [&_iframe]:w-screen"
        >
          {matchUrl(
            url => <iframe id="pp_iframe" src={url} />,
            () => null,
          )(payment)}
        </div>
      </Modal>
      <LoadingOverlay pos="fixed" visible={isLoading || url.isLoading} />
      <Suspense fallback={null}>
        {existingOrder && <WaitForPayment id={existingOrder.id} />}
      </Suspense>
    </>
  );
}

const Cost = (props: { id: number }) => {
  const [clearing] = useQuery(getVenueClearingIntegration, props.id, { select: decodeClearing });
  const { order } = useOrderState();
  const cost = OrderState.getOrderCost(order);

  if (Option.isSome(clearing) && clearing.value.provider === "PAY_PLUS") {
    return toShekel(Option.match(clearing.value.vendorData.service_charge, {
      onNone: () => cost,
      onSome: (_) => cost + _,
    }));
  }
  return toShekel(cost);
};

const ServiceCharge = (props: { id: number }) => {
  const [clearing] = useQuery(getVenueClearingIntegration, props.id, { select: decodeClearing });
  const t = useTranslations("menu.Components.ServiceCharge");

  return clearing.pipe(
    Option.filterMap(_ => _.provider === "PAY_PLUS" ? Option.some(_) : Option.none()),
    Option.flatMap(_ => _.vendorData.service_charge),
    Option.map(_ => (
      <li className="px-6 py-2">
        <p className="text-sm">
          {t("service charge")}:
          <span className="ms-14 rounded-full mx-1 text-xs font-medium text-emerald-800">
            {toShekel(_)}
          </span>
        </p>
      </li>
    )),
    Option.getOrNull,
  );
};

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
