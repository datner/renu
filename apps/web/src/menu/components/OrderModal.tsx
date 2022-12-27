import { useTranslations } from "next-intl"
import { OrderModalItem } from "./OrderModalItem"
import { Modal } from "./Modal"
import { titleFor, toShekel } from "src/core/helpers/content"
import { useMutation } from "@blitzjs/rpc"
import sendOrder from "../mutations/sendOrder"
import { useLocale } from "src/core/hooks/useLocale"
import { useZodParams } from "src/core/hooks/useParams"
import { Query } from "src/menu/validations/page"
import useMeasure from "react-use-measure"
import { usePrevious } from "src/core/hooks/usePrevious"
import { useSpring, a } from "@react-spring/web"
import { Locale } from "@prisma/client"
import * as E from "fp-ts/Either"
import { useAtomValue } from "jotai"
import { amountAtom, orderAtomFamily, orderItemsAtom, priceAtom } from "src/menu/jotai/order"

type Props = {
  open?: boolean
  onClose(): void
}

const title = titleFor(Locale.he)

export function OrderModal(props: Props) {
  const { onClose, open } = props
  const items = useAtomValue(orderItemsAtom)
  const amount = useAtomValue(amountAtom)
  const overallPrice = useAtomValue(priceAtom)
  const t = useTranslations("menu.Components.OrderModal")
  const locale = useLocale()
  const { restaurant } = useZodParams(Query)
  const [ref, { height }] = useMeasure()
  const isNoHeight = usePrevious(height) === 0
  const { h } = useSpring({ h: height, immediate: isNoHeight })
  const [sendOrderMutation, { isIdle, reset }] = useMutation(sendOrder, {
    onSuccess: E.match(
      (e) => {
        switch (e.tag) {
          case "ClearingMismatchError":
            return console.log("Clearing mismatch error", e)
          case "NoEnvVarError":
            return console.log("add missing env var", e.key)
          default: {
            console.group(e.tag)
            console.error(String(e.error))
            console.groupEnd()
          }
        }
      },
      (url) => {
        reset()
        return window.location.assign(url)
      }
    ),
  })

  const handleOrder = () => {
    sendOrderMutation({
      locale,
      venueIdentifier: restaurant,
      orderItems: items.map((it) => ({
        comment: it.comment,
        amount: it.amount,
        price: it.item.price,
        item: it.item.id,
        name: title(it.item),
        modifiers: it.modifiers,
      })),
    })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-3 pb-16 bg-white rounded-t-xl overflow-auto">
        <h3 className="text-2xl rtl:mt-9">{t("yourOrder")}</h3>
        <hr className="w-1/2 mt-1 mb-2" />
        <div>
          <a.div style={{ height: h }}>
            <ul ref={ref} className="divide-y divide-emerald-400">
              {items.map(({ item }) => (
                <OrderModalItem key={item.identifier} atom={orderAtomFamily(item)} />
              ))}
            </ul>
          </a.div>
          <div className="h-8" />
          <button
            onClick={handleOrder}
            disabled={!isIdle || amount === 0}
            className="inline-flex w-full justify-center items-center rounded-md border border-transparent shadow-lg shadow-emerald-300 px-4 py-2 bg-emerald-600 text-base text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:text-sm"
          >
            <span className="bg-emerald-100 border text-xs border-emerald-500 text-emerald-800 rounded-full h-6 w-6 flex justify-center items-center">
              {amount}
            </span>
            <span className="inline-block flex-grow px-3 text-left rtl:text-right">
              {isIdle ? t("order") : t("loading")}
            </span>
            <span className="tracking-wider font-thin">{toShekel(overallPrice)}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OrderModal
