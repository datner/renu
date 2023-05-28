import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as N from "@effect/data/Number";
import * as O from "@effect/data/Option";
import * as RA from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import { a, animated, useSpring } from "@react-spring/web";
import { useScroll } from "@use-gesture/react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { Blurhash } from "react-blurhash";
import { Number } from "shared/schema";
import { descriptionFor, priceShekel, titleFor } from "src/core/helpers/content";
import { clamp } from "src/core/helpers/number";
import { useLocale } from "src/core/hooks/useLocale";
import * as Order from "../hooks/useOrder";
import * as _Menu from "../schema";
import { getModifiers, ItemFieldValues, ItemModalForm } from "./ItemModalForm";
import { Modal } from "./Modal";
import { useOrderContext } from "./OrderContext";

const ImageBasis = {
  Max: 224,
  Min: 112,
} as const;

const THREE_QUATERS_PROGRESS = ImageBasis.Min * 1.5;

const clampImgHeight = clamp(ImageBasis.Min, ImageBasis.Max);
const clampBinary = clamp(0, 1);

export function ItemModal() {
  const [{ activeItem }, dispatch] = useOrderContext();
  const [open, setOpen] = useState(true);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <Modal
      open={O.isSome(activeItem) && open}
      onClose={handleClose}
      onDestroyed={() => {
        dispatch(Order.removeActiveItem());
        setOpen(true);
      }}
    >
      {O.getOrNull(
        O.map(activeItem, (item) => <_ItemModal activeItem={item} onClose={handleClose} dispatch={dispatch} />),
      )}
    </Modal>
  );
}

interface Props2 {
  readonly dispatch: Order.OrderDispatch;
  readonly activeItem: Order.ActiveItem;
  readonly onClose: () => void;
}

const AnimatedBlurhash = animated(Blurhash);

function _ItemModal(props: Props2) {
  const { activeItem, dispatch, onClose } = props;
  const locale = useLocale();
  const title = titleFor(locale);
  const desc = descriptionFor(locale);
  const [containerEl, set] = useState<HTMLDivElement | null>(null);
  const item = useMemo(() => Order.getActiveMenuItem(activeItem), [activeItem]);
  const { shadow, imgHeight, imgOpacity, rounded, titleOpacity, y } = useSpring({
    shadow: 0,
    imgHeight: ImageBasis.Max as number,
    imgOpacity: 1,
    titleOpacity: 1,
    rounded: 12,
    y: -58,
  });

  const bind = useScroll(({ xy: [_, yd] }) => {
    const halfwayProgress = clampBinary(yd / ImageBasis.Min);
    const lastQuaterProgress = clampBinary(yd / THREE_QUATERS_PROGRESS);
    imgHeight.set(clampImgHeight(ImageBasis.Max - yd + 20));
    imgOpacity.set(1 - (yd - ImageBasis.Min) / ImageBasis.Min);
    if (rounded.get() !== 0) {
      rounded.set(12 - halfwayProgress * 12);
    }

    if (lastQuaterProgress === 1) {
      y.start(0);
      titleOpacity.start(0);
      shadow.start(1);
    }

    if (lastQuaterProgress === 0) {
      y.stop();
      titleOpacity.stop();
      shadow.stop();
      y.start(-58).then(() => rounded.start(12));
      titleOpacity.start(1);
      shadow.start(0);
    }
  });

  const handleSubmit = useCallback(
    ({ amount, comment, modifiers }: ItemFieldValues) => {
      onClose();
      const { extras, oneOfs } = getModifiers(item.modifiers);

      const oneOfMap = HashMap.make(...RA.map(oneOfs, (oo) => [String(oo.id), oo] as const));
      const extrasMap = HashMap.make(...RA.map(extras, (oo) => [String(oo.id), oo] as const));

      const oneOfCost = pipe(
        RR.map(modifiers.oneOf, (oo, id) => O.tuple(O.some(oo), HashMap.get(oneOfMap, id))),
        RR.compact,
        RR.map(([oo, of]) =>
          O.tuple(
            O.some(oo.amount),
            RA.findFirst(of.config.options, (o) => o.identifier === oo.choice),
          )
        ),
        RR.compact,
        RR.collect((_, [am, opt]) => am * opt.price),
        N.sumAll,
      );

      const extrasCost = pipe(
        RR.map(modifiers.extras, (oo, id) => O.tuple(O.some(oo), HashMap.get(extrasMap, id))),
        RR.compact,
        RR.collect((_, [oo, of]) =>
          RR.collect(oo.choices, (choice, amount) =>
            O.tuple(
              O.some(amount),
              RA.findFirst(of.config.options, (o) => o.identifier === choice),
            ))
        ),
        RA.flatten,
        RA.compact,
        RA.map(([am, opt]) => am * opt.price),
        N.sumAll,
      );

      const single = Order.SingleOrderItem({
        item,
        comment,
        valid: true,
        cost: Number.Cost(N.sumAll([item.price, oneOfCost, extrasCost]) * amount),
        modifiers: HashMap.make(
          ...pipe(
            modifiers.oneOf,
            RR.filter((_, id) => HashMap.has(oneOfMap, id)),
            RR.collect((_id, oo) => {
              const id = _Menu.ItemModifierId(parseInt(_id, 10));
              return [
                id,
                Order.OneOf({
                  id,
                  amount: Number.Amount(1),
                  config: Data.struct(HashMap.unsafeGet(oneOfMap, _id).config),
                  choice: oo.choice,
                }),
              ] as const;
            }),
          ),
          ...pipe(
            modifiers.extras,
            RR.filter((_, id) => HashMap.has(extrasMap, id)),
            RR.collect((_id, oo) => {
              const id = _Menu.ItemModifierId(parseInt(_id, 10));
              return [
                id,
                Order.Extras({
                  id,
                  choices: pipe(
                    oo.choices,
                    RR.filter((amount) => amount > 0),
                    RR.map(Number.Amount),
                    RR.toEntries,
                    HashMap.fromIterable,
                  ),
                  config: Data.struct(HashMap.unsafeGet(extrasMap, _id).config),
                }),
              ] as const;
            }),
          ),
        ),
      });

      const order = amount > 1 ? Order.toMultiOrderItem(single, amount) : single;

      const changeItem = () => {
        if (Order.isExistingActiveItem(activeItem)) {
          if (amount === 0) return Order.removeItem(activeItem.key);

          return Order.updateItem(activeItem.key, () => order);
        }

        return Order.addItem(order);
      };
      dispatch(changeItem());
    },
    [activeItem, dispatch, item, onClose],
  );

  const orderItem = pipe(
    activeItem,
    O.liftPredicate(Order.isExistingActiveItem),
    O.map((s) => s.item),
  );

  return (
    <>
      <a.div
        ref={(el) => set(el)}
        {...bind()}
        style={{ borderTopLeftRadius: rounded, borderTopRightRadius: rounded }}
        className="relative flex flex-col overflow-auto bg-white pb-12"
      >
        <div className="flex flex-col-reverse shrink-0 basis-56">
          <a.div
            style={{ height: imgHeight, opacity: imgOpacity }}
            className="relative w-full self-end grow-0 shrink-0"
          >
            {pipe(
              O.map(
                item.blurHash,
                (hash) => <AnimatedBlurhash hash={hash} width="100%" style={{ height: imgHeight }} />,
              ),
              O.getOrNull,
            )}
            {item?.image && (
              <Image
                className="object-cover"
                fill
                src={item.image}
                placeholder={O.match(item.blurDataUrl, () => "empty", () => "blur")}
                blurDataURL={O.getOrUndefined(item.blurDataUrl)}
                alt={item.identifier}
                sizes="100vw"
              />
            )}
          </a.div>
        </div>
        <div className="mt-3 z-10 px-4 pb-4 sm:mt-5 rtl:text-right">
          <a.h3
            style={{ opacity: titleOpacity }}
            className="text-3xl leading-6 font-medium text-gray-900"
          >
            {title(item.content)}
          </a.h3>
          <p className="mt-2 text-emerald-600">{priceShekel(item)}</p>
          <p className="mt-2 text-sm text-gray-500">{desc(item.content)}</p>
        </div>
        <div className="flex flex-col px-4">
          <ItemModalForm
            containerEl={containerEl}
            item={item}
            order={orderItem}
            onSubmit={handleSubmit}
          />
        </div>
      </a.div>
      <a.div
        className="h-14 w-full z-20 absolute flex justify-center items-center bg-white"
        style={{
          y,
          boxShadow: shadow.to(
            (s) =>
              `0 20px 25px -5px rgb(0 0 0 / ${s * 0.1}),
              0 8px 10px -6px rgb(0 0 0 / ${s * 0.1})`,
          ),
        }}
      >
        <a.h3 className="text-2xl leading-6 font-medium text-gray-900">{title(item.content)}</a.h3>
      </a.div>
    </>
  );
}

export default ItemModal;
