import * as B from "@effect/data/Boolean";
import * as Equal from "@effect/data/Equal";
import * as N from "@effect/data/Number";
import { MinusCircleIcon, PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { a, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { clsx } from "clsx";
import Image from "next/image";
import { memo, useMemo } from "react";
import { Blurhash } from "react-blurhash";
import { useIsRtl } from "src/core/hooks/useIsRtl";
import { useLocale } from "src/core/hooks/useLocale";
import * as Order from "../hooks/useOrder";
import * as _Menu from "../schema";
import { ItemData } from "./ItemData";
import { useOrderDispatch } from "./OrderContext";

type Props = {
  item: Order.ActiveItem;
};

const PlusCircle = a(PlusCircleIcon);
const MinusCircle = a(MinusCircleIcon);
const XCircle = a(XCircleIcon);

const isNegative = N.lessThan(0);

export const ListItem = memo(
  function ListItem(props: Props) {
    const { item: _ } = props;
    const dispatch = useOrderDispatch();
    const item = Order.getActiveMenuItem(_);
    const amount = Order.getActiveAmount(_);
    const cost = Order.getActiveCost(_);
    const locale = useLocale();
    const isRtl = useIsRtl();
    const content = item.content.find((it) => it.locale === locale);
    const isInOrder = Order.isExistingActiveItem(_);
    const hideIndicator = isRtl ? 40 : -40;
    const [{ x, scale }, api] = useSpring(() => ({
      x: 0,
      scale: 1,
    }));
    const bind = useDrag(
      ({ down: active, last, offset: [ox] }) => {
        const offset = N.clamp(ox, -70, 70);
        api.start({
          x: active ? offset : 0,
          scale: active ? 1.02 : 1,
          immediate: (name) => active && name === "x",
        });

        const isIncrement = B.not(B.xor(isNegative(offset), isRtl));

        // not active, last event, outside of -69 -- 69
        const isRelevant = B.every([B.not(active), last, B.not(N.between(offset, -69, 69))]);
        if (isRelevant) {
          if (isInOrder) {
            requestAnimationFrame(() =>
              B.match(
                isIncrement,
                () => {
                  return dispatch(Order.decrementItem(_.key));
                },
                () => dispatch(Order.incrementItem(_.key)),
              )
            );
          } else if (isIncrement) {
            requestAnimationFrame(() => dispatch(Order.addEmptyItem(_.item)));
          }
        }
      },
      { axis: "x", from: () => [x.get(), 0] },
    );
    const styles = useSpring({
      x: isInOrder ? 0 : hideIndicator,
      opacity: isInOrder ? 1 : 0,
    });

    const opacity = useMemo(() => {
      const output = [isInOrder ? 1 : 0.1, 0.1, 0.1, 1];
      return x.to({
        range: [-70, -60, 60, 70],
        output: isRtl ? output.reverse() : output,
      });
    }, [isInOrder, isRtl, x]);

    const overOne = amount > 1;

    const bg = useMemo(
      () => (
        <a.div
          className={`absolute rtl:bg-gradient-to-r bg-gradient-to-l ${
            isInOrder ? "from-red-300" : "from-gray-300"
          } to-green-200 flex items-center h-36 inset-x-2 sm:inset-x-6 transition-all rounded-lg`}
        >
          <div className="flex-1 flex text-green-800">
            <PlusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
          </div>
          <div
            className={`flex-1 flex flex-row-reverse ${isInOrder ? "text-red-700" : "text-gray-700"}`}
          >
            {overOne
              ? <MinusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
              : <XCircle style={{ opacity }} className="w-10 h-10 mx-3" />}
          </div>
        </a.div>
      ),
      [overOne, isInOrder, opacity],
    );

    if (!content) return null;

    return (
      <a.li
        {...bind()}
        onClick={() => dispatch(isInOrder ? Order.setExistingActiveItem(_.key) : Order.setNewActiveItem(item))}
        className="relative touch-pan-y px-2 sm:px-6"
      >
        {bg}
        <a.div
          style={{ x, scale }}
          className="relative flex flex-1 pointer-events-none h-36 overflow-hidden rounded-lg bg-white shadow"
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
            {item.blurHash && <Blurhash hash={item.blurHash} width={192} height={128} />}
            {item.image && (
              <Image
                className="object-cover"
                fill
                src={item.image}
                placeholder={item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={item.blurDataUrl ?? undefined}
                quality={20}
                alt={item.identifier}
                sizes="(min-width: 370px) 12rem,
              8rem"
              />
            )}
          </div>
        </a.div>
      </a.li>
    );
  },
  (prev, next) => Equal.equals(prev.item, next.item),
);
