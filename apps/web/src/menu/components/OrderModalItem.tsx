import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { ResizeObserver } from "@juggle/resize-observer";
import { a, useChain, useSpring, useSpringRef } from "@react-spring/web";
import { pipe } from "effect/Function";
import * as O from "effect/Option";
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
  const { item, comment, valid } = orderItem;
  const amount = Order.isMultiOrderItem(orderItem) ? orderItem.amount : 1;
  const locale = useLocale();

  const title = titleFor(locale);
  return (
    <li className="group">
      <div className="group-first-of-type:hidden divider mx-3" />
      <div data-error={!valid} className="flex py-8 px-3 items-center data-[error=true]:bg-gradient-to-l from-red-200">
        <div
          className="flex-grow mr-px"
          onClick={() => {
            dispatch(Order.setExistingActiveItem(key));
          }}
        >
          <div className="flex">
            <div className="relative rounded-md mx-2 shrink-0">
              {pipe(
                item.blurHash,
                O.map(hash => <Blurhash className="rounded-md overflow-hidden" hash={hash} width={96} height={64} />),
                O.getOrNull,
              )}
              {item.image && (
                <Image
                  src={`${item.image}?cs=strip`}
                  className="object-cover overflow-hidden rounded-md h-16 w-24"
                  fill
                  sizes="(min-width: 370px) 12rem,
              8rem"
                  placeholder={O.match(item.blurDataUrl, { onNone: () => "empty", onSome: () => "blur" })}
                  blurDataURL={O.getOrUndefined(item.blurDataUrl)}
                  quality={20}
                  alt={item.identifier}
                />
              )}
            </div>
            <p className="text-sm whitespace-pre-linetruncate">
              {!valid && (
                <span className="text-red-700">
                  <ExclamationCircleIcon className="h-5 w-5" />
                </span>
              )}
              <span>{title(item.content)}</span>
              <br />
              <span className="rounded-full mx-1 text-xs font-medium text-emerald-800">
                {toShekel(orderItem.cost)}
              </span>
              <br />
              <span className="text-gray-500 truncate">{comment}</span>
            </p>
          </div>
        </div>
        <div className="basis-32 shrink-0">
          {item.price > 0
            ? (
              <Thing
                minimum={0}
                amount={amount}
                onIncrement={() => dispatch(Order.incrementItem(key))}
                onDecrement={() => dispatch(Order.decrementItem(key))}
              />
            )
            : <button onClick={() => dispatch(Order.setExistingActiveItem(key))} className="btn w-full">Edit</button>}
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
    width: show ? containerWidth : 48,
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
          className="btn btn-square"
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
