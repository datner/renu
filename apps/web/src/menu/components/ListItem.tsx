import * as Equal from "@effect/data/Equal";
import { pipe } from "@effect/data/Function";
import * as N from "@effect/data/Number";
import * as O from "@effect/data/Option";
import { MinusCircleIcon, PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { a, SpringValue, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { clsx } from "clsx";
import Image from "next/image";
import { memo, ReactNode, useCallback } from "react";
import { Blurhash } from "react-blurhash";
import { useIsRtl } from "src/core/hooks/useIsRtl";
import { useLocale } from "src/core/hooks/useLocale";
import * as Order from "../hooks/useOrder";
import * as _Menu from "../schema";
import { ItemData } from "./ItemData";
import { useOrderDispatch } from "./OrderContext";

type Props = {
  item: Order.ActiveItem;
  priority: boolean;
};

const PlusCircle = a(PlusCircleIcon);
const MinusCircle = a(MinusCircleIcon);
const XCircle = a(XCircleIcon);

const isPositive = N.greaterThan(0);

export const ListItem = memo(
  function ListItem(props: Props) {
    const { item: _, priority } = props;
    const dispatch = useOrderDispatch();
    const item = Order.getActiveMenuItem(_);
    const amount = Order.getActiveAmount(_);
    const cost = Order.getActiveCost(_);
    const valid = Order.getActiveValidity(_);
    const locale = useLocale();
    const isRtl = useIsRtl();
    const content = item.content.find((it) => it.locale === locale);
    const isInOrder = Order.isExistingActiveItem(_);
    const hideIndicator = isRtl ? 40 : -40;
    const styles = useSpring({
      x: isInOrder ? 0 : hideIndicator,
      opacity: isInOrder ? 1 : 0,
    });

    const overOne = amount > 1;

    const bg = useCallback(
      (x: SpringValue<number>) => {
        const output = [isInOrder ? 1 : 0.1, 0.1, 0.1, 1];
        const opacity = x.to({
          range: [-70, -60, 60, 70],
          output,
        });
        return (
          <a.div
            className={`absolute bg-gradient-to-l ${
              isInOrder ? "from-red-300" : "from-gray-300"
            } to-green-200 flex rtl:flex-row-reverse items-center h-36 inset-x-2 sm:inset-x-6 transition-all rounded-lg`}
          >
            <div className="flex-1 flex rtl:flex-row-reverse text-green-800">
              <PlusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
            </div>
            <div
              className={`flex-1 flex ltr:flex-row-reverse ${isInOrder ? "text-red-700" : "text-gray-700"}`}
            >
              {overOne
                ? <MinusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
                : <XCircle style={{ opacity }} className="w-10 h-10 mx-3" />}
            </div>
          </a.div>
        );
      },
      [overOne, isInOrder],
    );

    if (!content) return null;

    return (
      <DraggableSlider
        bg={bg}
        valid={valid}
        onClick={() => dispatch(isInOrder ? Order.setExistingActiveItem(_.key) : Order.setNewActiveItem(_.item))}
        onIncrement={() => dispatch(isInOrder ? Order.incrementItem(_.key) : Order.addEmptyItem(_.item))}
        onDecrement={() => isInOrder ? dispatch(Order.decrementItem(_.key)) : void 0}
      >
        <a.div style={styles} className="inset-y-0 absolute ltr:left-0 rtl:right-0">
          <div
            className={clsx("inset-y-0 bg-gradient-to-t w-2 absolute shadow-2xl", [
              "group-5nth-1:from-emerald-500 group-5nth-1:to-emerald-700",
              "group-5nth-2:from-ocre-500 group-5nth-2:to-ocre-600",
              "group-5nth-3:from-ginger-500 group-5nth-3:to-ginger-600",
              "group-5nth-4:from-coral-500 group-5nth-4:to-coral-600",
              "group-5nth-5:from-blush-500 group-5nth-5:to-blush-600",
            ])}
          />
        </a.div>
        <div className="grow w-40 overflow-hidden">
          <ItemData content={content} price={cost} amount={amount} />
        </div>
        <div className="w-32 relative xs:w-48 m-2 rounded-md overflow-hidden h-32">
          {pipe(O.map(item.blurHash, hash => <Blurhash hash={hash} width={192} height={128} />), O.getOrNull)}
          {item.image && (
            <Image
              priority={priority}
              className="object-cover"
              fill
              src={item.image}
              placeholder={O.match(item.blurDataUrl, () => "empty", () => "blur")}
              blurDataURL={O.getOrUndefined(item.blurDataUrl)}
              quality={20}
              alt={item.identifier}
              sizes="(min-width: 370px) 12rem,
              8rem"
            />
          )}
        </div>
      </DraggableSlider>
    );
  },
  (prev, next) => Equal.equals(prev.item, next.item),
);

interface DraggableSliderProps {
  readonly children: ReactNode;
  readonly bg: (x: SpringValue<number>) => ReactNode;
  readonly valid: boolean;
  readonly onIncrement: () => void;
  readonly onDecrement: () => void;
  readonly onClick: () => void;
}

function DraggableSlider(props: DraggableSliderProps) {
  const { children, bg, valid, onDecrement, onIncrement, onClick } = props;
  const [{ x, scale }, api] = useSpring(() => ({
    x: 0,
    scale: 1,
  }));
  const bind = useDrag(
    ({ active, movement: [x], last, memo }) => {
      api.start({
        x: active ? x : 0,
        scale: active ? 1.02 : 1,
        immediate: (name) => active && name === "x",
      });

      if (!last) return Math.abs(x) > 60 && isPositive(x) ? "increment" : "decrement";

      switch (memo) {
        case "increment":
          onIncrement();
          break;

        case "decrement":
          onDecrement();
          break;
      }
    },
    {
      axis: "x",
      filterTaps: true,
      rubberband: 0.05,
      bounds: { left: -70, right: 70 },
      from: [0, 0],
    },
  );

  return (
    <a.li
      {...bind()}
      onClick={onClick}
      className="relative touch-pan-y px-2 sm:px-6"
    >
      {bg(x)}
      <a.div
        style={{ x, scale }}
        aria-invalid={!valid}
        className="relative flex flex-1 pointer-events-none h-36 overflow-hidden rounded-lg bg-white shadow error:bg-red-200 error:ring-2 error:ring-red-500"
      >
        {children}
      </a.div>
    </a.li>
  );
}
