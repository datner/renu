import Image from "next/image"
import { a, useSpring } from "@react-spring/web"
import { useLocale } from "src/core/hooks/useLocale"
import { decrement, increment, pipe } from "fp-ts/function"
import * as L from "monocle-ts/Lens"
import * as A from "fp-ts/Array"
import { ItemData } from "./ItemData"
import { memo } from "react"
import { useDrag } from "@use-gesture/react"
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline"
import { useIsRtl } from "src/core/hooks/useIsRtl"
import { clamp } from "src/core/helpers/number"
import { useAtomValue } from "jotai"
import { OrderFamilyAtom, OrderItem } from "src/menu/jotai/order"
import { max, multiply, add } from "src/core/helpers/number"
import { useUpdateOrderItem } from "../hooks/useUpdateOrderItem"
import { MonoidSum } from "fp-ts/lib/number"

type Props = {
  atom: OrderFamilyAtom
  onClick(): void
}

const PlusCircle = a(PlusCircleIcon)
const MinusCircle = a(MinusCircleIcon)
const XCircle = a(XCircleIcon)

const amount = pipe(L.id<OrderItem>(), L.prop("amount"))

const incAmount = pipe(amount, L.modify(increment))

const decAmount = pipe(amount, L.modify(decrement))

export const ListItem = memo(function ListItem(props: Props) {
  const { atom, onClick } = props
  const order = useAtomValue(atom)
  const setOrder = useUpdateOrderItem(atom)
  const locale = useLocale()
  const isRtl = useIsRtl()
  const content = order.item.content.find((it) => it.locale === locale)
  const isInOrder = order.amount > 0
  const hideIndicator = isRtl ? 40 : -40
  const [{ x, scale }, api] = useSpring(() => ({
    x: 0,
    scale: 1,
  }))
  const bind = useDrag(
    ({ down: active, offset: [ox] }) => {
      const getX = clamp(-70, 70)
      api.start({
        x: active ? getX(ox) : 0,
        scale: active ? 1.02 : 1,
        immediate: (name) => active && name === "x",
      })
      if (!active) {
        const current = isRtl ? -x.get() : x.get()
        if (current >= 70) setOrder(incAmount)
        if (current <= -70) setOrder(decAmount)
      }
    },
    { axis: "x", from: () => [x.get(), 0] }
  )
  const styles = useSpring({
    x: isInOrder ? 0 : hideIndicator,
    opacity: isInOrder ? 1 : 0,
  })

  const modPrice = pipe(
    order.modifiers,
    A.foldMap(MonoidSum)((m) => m.price * m.amount)
  )

  const price = pipe(order.amount, max(1), multiply(order.item.price), add(modPrice))

  if (!content) return null

  const output = [isInOrder ? 1 : 0.1, 0.1, 0.1, 1]
  const opacity = x.to({
    range: [-70, -60, 60, 70],
    output: isRtl ? output.reverse() : output,
  })

  return (
    <a.li {...bind()} onClick={onClick} className="relative touch-pan-y px-2 sm:px-6">
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
          {order.amount > 1 ? (
            <MinusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
          ) : (
            <XCircle style={{ opacity }} className="w-10 h-10 mx-3" />
          )}
        </div>
      </a.div>
      <a.div
        style={{ x, scale }}
        className="relative flex flex-1 pointer-events-none h-36 overflow-hidden rounded-lg bg-white shadow"
      >
        <a.div style={styles} className="inset-y-0 absolute ltr:left-0 rtl:right-0">
          <div className="inset-y-0 bg-gradient-to-t from-emerald-500 to-emerald-700 w-2 absolute shadow-2xl" />
        </a.div>
        <div className="grow w-40 overflow-hidden">
          <ItemData content={content} price={price} amount={order.amount} />
        </div>
        <div className="w-32 relative xs:w-48 m-2 rounded-md overflow-hidden h-32">
          {order.item.image && (
            <Image
              className="object-cover"
              fill
              src={order.item.image}
              placeholder={order.item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={order.item.blurDataUrl ?? undefined}
              quality={20}
              alt={order.item.identifier}
              sizes="(min-width: 370px) 12rem,
              8rem"
            />
          )}
        </div>
      </a.div>
    </a.li>
  )
})
