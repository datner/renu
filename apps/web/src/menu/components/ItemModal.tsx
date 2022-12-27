import Image from "next/image"
import { useScroll } from "@use-gesture/react"
import { useLocale } from "src/core/hooks/useLocale"
import { clamp } from "src/core/helpers/number"
import { a, useSpring } from "@react-spring/web"
import { descriptionFor, priceShekel, titleFor } from "src/core/helpers/content"
import { ItemModalForm } from "./ItemModalForm"
import { useState } from "react"
import { Modal } from "./Modal"
import { useAtom, useAtomValue } from "jotai"
import { ModifierItem, OrderFamilyAtom } from "../jotai/order"
import { useUpdateOrderItem } from "../hooks/useUpdateOrderItem"
import { itemModalOpenAtom } from "../jotai/item"
import { pipe, tuple } from "fp-ts/function"
import { Ord } from "fp-ts/string"
import { last } from "fp-ts/Semigroup"
import * as T from "fp-ts/Tuple"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/Array"
import * as RA from "fp-ts/ReadonlyArray"
import * as RR from "fp-ts/ReadonlyRecord"
import { Modifier } from "db/itemModifierConfig"

type Props = {
  atom: OrderFamilyAtom
}

const ImageBasis = {
  Max: 224,
  Min: 112,
} as const

const THREE_QUATERS_PROGRESS = ImageBasis.Min * 1.5

const clampImgHeight = clamp(ImageBasis.Min, ImageBasis.Max)
const clampBinary = clamp(0, 1)

export function ItemModal(props: Props) {
  const { atom } = props
  const [open, setOpen] = useAtom(itemModalOpenAtom)
  const order = useAtomValue(atom)
  const setOrder = useUpdateOrderItem(atom)
  const locale = useLocale()
  const title = titleFor(locale)
  const desc = descriptionFor(locale)
  const [containerEl, set] = useState<HTMLDivElement | null>(null)
  const { shadow, imgHeight, imgOpacity, rounded, titleOpacity, y } = useSpring({
    shadow: 0,
    imgHeight: ImageBasis.Max as number,
    imgOpacity: 1,
    titleOpacity: 1,
    rounded: 12,
    y: -58,
  })

  const bind = useScroll(({ xy: [_, yd] }) => {
    const halfwayProgress = clampBinary(yd / ImageBasis.Min)
    const lastQuaterProgress = clampBinary(yd / THREE_QUATERS_PROGRESS)
    imgHeight.set(clampImgHeight(ImageBasis.Max - yd + 20))
    imgOpacity.set(1 - (yd - ImageBasis.Min) / ImageBasis.Min)
    if (rounded.get() !== 0) {
      rounded.set(12 - halfwayProgress * 12)
    }

    if (lastQuaterProgress === 1) {
      y.start(0)
      titleOpacity.start(0)
      shadow.start(1)
    }

    if (lastQuaterProgress === 0) {
      y.stop()
      titleOpacity.stop()
      shadow.stop()
      y.start(-58).then(() => rounded.start(12))
      titleOpacity.start(1)
      shadow.start(0)
    }
  })

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
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
            {order.item.image && (
              <Image
                className="object-cover"
                fill
                src={order.item.image}
                placeholder={order.item.blurDataUrl ? "blur" : "empty"}
                blurDataURL={order.item.blurDataUrl ?? undefined}
                alt={order.item.identifier}
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
            {title(order.item)}
          </a.h3>
          <p className="mt-2 text-emerald-600">₪ {priceShekel(order.item)}</p>
          <p className="mt-2 text-sm text-gray-500">{desc(order.item)}</p>
        </div>
        <div className="flex flex-col px-4">
          <ItemModalForm
            options={order.item.categoryId === 3}
            containerEl={containerEl}
            order={order}
            onSubmit={({ amount, comment, modifiers }) => {
              setOpen(false)
              const modmap = RR.fromFoldableMap(last<[number, Modifier]>(), RA.Foldable)(
                order.item.modifiers,
                (mod) => [mod.config.identifier, tuple(mod.id, mod)]
              )

              const getId = (ref: string) =>
                pipe(
                  O.fromNullable(modmap[ref]),
                  O.map(T.fst),
                  O.getOrElse(() => -1)
                )

              const getPrice = (ref: string, choice: string) =>
                pipe(
                  O.fromNullable(modmap[ref]),
                  O.map(T.snd),
                  O.chain((m) =>
                    pipe(
                      m.config.options as { identifier: string; price: number }[],
                      A.findFirst((o) => o.identifier === choice)
                    )
                  ),
                  O.map((m) => m.price),
                  O.getOrElse(() => 0)
                )

              setOrder({
                item: order.item,
                amount,
                comment,
                modifiers: [
                  ...pipe(
                    modifiers.oneOf,
                    RR.collect(Ord)(
                      (_, of): ModifierItem => ({
                        ...of,
                        id: getId(of.identifier),
                        price: getPrice(of.identifier, of.choice),
                        _tag: "oneOf",
                      })
                    )
                  ),
                  ...pipe(
                    modifiers.extras,
                    RR.collect(Ord)((_, ex) =>
                      pipe(
                        ex.choices,
                        RR.collect(Ord)(
                          (choice, amount): ModifierItem => ({
                            identifier: ex.identifier,
                            _tag: "extras",
                            id: getId(ex.identifier),
                            price: getPrice(ex.identifier, choice),
                            choice,
                            amount,
                          })
                        )
                      )
                    ),
                    RA.flatten,
                    RA.filter((mi) => mi.amount > 0)
                  ),
                ],
              })
            }}
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
              0 8px 10px -6px rgb(0 0 0 / ${s * 0.1})`
          ),
        }}
      >
        <a.h3 className="text-2xl leading-6 font-medium text-gray-900">{title(order.item)}</a.h3>
      </a.div>
    </Modal>
  )
}

export default ItemModal
