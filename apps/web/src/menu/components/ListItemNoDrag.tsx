import Image from "next/image"
import { a, useSpring } from "@react-spring/web"
import { useLocale } from "src/core/hooks/useLocale"
import { pipe } from "fp-ts/function"
import * as A from "@fp-ts/core/ReadonlyArray"
import { ItemData } from "./ItemData"
import { memo } from "react"
import { useIsRtl } from "src/core/hooks/useIsRtl"
import { useAtomValue } from "jotai"
import { OrderFamilyAtom } from "src/menu/jotai/order"
import { max, multiply, add } from "src/core/helpers/number"

type Props = {
  atom: OrderFamilyAtom
  onClick(): void
}

export const ListItemNoDrag = memo(function ListItem(props: Props) {
  const { atom, onClick } = props
  const itemInOrder = useAtomValue(atom)
  const locale = useLocale()
  const isRtl = useIsRtl()
  const content = itemInOrder.item.content.find((it) => it.locale === locale)
  const isInOrder = itemInOrder.amount > 0
  const hideIndicator = isRtl ? 40 : -40
  const styles = useSpring({
    x: isInOrder ? 0 : hideIndicator,
    opacity: isInOrder ? 1 : 0,
  })

  const modPrice = pipe(
    itemInOrder.modifiers,
    A.reduce(0, (sum, m) => sum + m.price * m.amount)
  )

  const price = pipe(itemInOrder.amount, max(1), multiply(itemInOrder.item.price), add(modPrice))

  if (!content) return null

  return (
    <li onClick={onClick} className="relative touch-pan-y px-2 sm:px-6">
      <div className="relative flex flex-1 pointer-events-none h-36 overflow-hidden rounded-lg bg-white shadow">
        <a.div style={styles} className="inset-y-0 absolute ltr:left-0 rtl:right-0">
          <div className="inset-y-0 bg-gradient-to-t from-emerald-500 to-emerald-700 w-2 absolute shadow-2xl" />
        </a.div>
        <div className="grow w-40 overflow-hidden">
          <ItemData content={content} price={price} amount={itemInOrder.amount} />
        </div>
        <div className="w-32 relative xs:w-48 m-2 rounded-md overflow-hidden h-32">
          {itemInOrder.item.image && (
            <Image
              className="object-cover"
              fill
              src={itemInOrder.item.image}
              placeholder={itemInOrder.item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={itemInOrder.item.blurDataUrl ?? undefined}
              quality={20}
              alt={itemInOrder.item.identifier}
              sizes="(min-width: 370px) 12rem,
              8rem"
            />
          )}
        </div>
      </div>
    </li>
  )
})
