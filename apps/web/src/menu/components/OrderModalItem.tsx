import { ResizeObserver } from "@juggle/resize-observer";
import { a, useChain, useSpring, useSpringRef } from "@react-spring/web";
import Image from "next/image";
import { useState } from "react";
import { Blurhash } from "react-blurhash";
import useMeasure from "react-use-measure";
import { titleFor, toShekel } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import * as Order from "src/menu/hooks/useOrder";
import { AmountButtons, AmountButtonsProps } from "./AmountButtons";

type Props = {
  dispatch: Order.OrderDispatch;
  orderItem: Order.OrderItem;
  hash: Order.OrderItemKey;
};

export function OrderModalItem(props: Props) {
  const { dispatch, orderItem, hash: key } = props;
  const { item, comment } = orderItem;
  const amount = Order.isMultiOrderItem(orderItem) ? orderItem.amount : 1;
  const locale = useLocale();

  const title = titleFor(locale);
  return (
    <li className="pt-8 pb-6">
      <div className="h-14 flex items-center">
        <div
          className="flex-grow bg-white mr-px"
          onClick={() => {
            dispatch(Order.setExistingActiveItem(key));
          }}
        >
          <div className="flex">
            <div className="h-16 w-24 relative rounded-md overflow-hidden mx-2">
              {item.blurHash && <Blurhash hash={item.blurHash} width={96} height={64} />}
              {item.image && (
                <Image
                  priority
                  src={item.image}
                  className="object-cover"
                  fill
                  sizes="(min-width: 370px) 12rem,
              8rem"
                  placeholder={item.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={item.blurDataUrl ?? undefined}
                  quality={20}
                  alt={item.identifier}
                />
              )}
            </div>
            <p className="text-sm whitespace-pre-line">
              <span>{title(item)}</span>
              <br />
              <span className="rounded-full mx-1 text-xs font-medium text-emerald-800">
                {toShekel(orderItem.cost)}
              </span>
              <br />
              <span className="text-gray-500">{comment}</span>
            </p>
          </div>
        </div>
        <div className="basis-32">
          <Thing
            minimum={0}
            amount={amount}
            onIncrement={() => dispatch(Order.incrementItem(key))}
            onDecrement={() => dispatch(Order.decrementItem(key))}
          />
        </div>
      </div>
    </li>
  );
}

function Thing(props: AmountButtonsProps) {
  const [show, setShow] = useState(false);
  const [ref, { width: containerWidth }] = useMeasure({ polyfill: ResizeObserver });
  const firstApi = useSpringRef();
  const { width } = useSpring({
    ref: firstApi,
    width: show ? containerWidth : 40,
  });

  const secondApi = useSpringRef();
  const { opacity, pointerEvents } = useSpring({
    ref: secondApi,
    opacity: show ? 1 : 0,
    pointerEvents: show ? ("auto" as const) : ("none" as const),
    config: { mass: 5, tension: 500, friction: 80 },
  });

  useChain([firstApi, secondApi], [0, 0.3]);

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center"
      onClick={() => setShow(true)}
    >
      <a.div
        className="absolute inset-0 flex flex-row-reverse items-center"
        style={{ opacity: opacity.to((o) => 1 - o) }}
      >
        <a.div
          style={{ width }}
          className="h-10 rounded-md text-sm sm:text-base text-emerald-500 border-gray-300 flex items-center justify-center bg-emerald-50 border"
        >
          {props.amount}
        </a.div>
      </a.div>
      <a.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity, pointerEvents }}
      >
        <AmountButtons {...props} />
      </a.div>
    </div>
  );
}
