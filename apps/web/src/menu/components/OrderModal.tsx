import { useTranslations } from "next-intl"
import { OrderModalItem } from "./OrderModalItem"
import { Modal } from "./Modal"
import { toShekel } from "src/core/helpers/content"
import { useMutation } from "@blitzjs/rpc"
import sendOrder from "../mutations/sendOrder"
import { useLocale } from "src/core/hooks/useLocale"
import { useZodParams } from "src/core/hooks/useParams"
import { Query } from "src/menu/validations/page"
import useMeasure from "react-use-measure"
import { usePrevious } from "src/core/hooks/usePrevious"
import { useSpring, a } from "@react-spring/web"
import * as Order from "src/menu/hooks/useOrder"
import * as HashMap from "@effect/data/HashMap"
import * as A from "@effect/data/ReadonlyArray"
import { pipe, absurd } from "@effect/data/Function"

type Props = {
  open?: boolean
  onClose(): void
  order: Order.Order
  dispatch: Order.OrderDispatch
}

export function OrderModal(props: Props) {
  const { onClose, open, order, dispatch } = props
  const t = useTranslations("menu.Components.OrderModal")
  const locale = useLocale()
  const { restaurant } = useZodParams(Query)
  const [ref, { height }] = useMeasure()
  const isNoHeight = usePrevious(height) === 0
  const { h } = useSpring({ h: height, immediate: isNoHeight })
  const [sendOrderMutation, { isLoading }] = useMutation(sendOrder, {
    onSuccess: (url) => {
      return window.location.assign(url.href)
    },
  })

  const handleOrder = () => {
    if (Order.isEmptyOrder(order)) return

    sendOrderMutation({
      locale,
      venueIdentifier: restaurant,
      orderItems: pipe(
        order.items,
        HashMap.map((it) => ({
          comment: it.comment,
          amount: Order.isMultiOrderItem(it) ? it.amount : Order.Amount(1),
          cost: it.cost,
          item: it.item.id,
          modifiers: pipe(
            it.modifiers,
            A.fromIterable,
            A.map(([id, mod]) => {
              if (Order.isOneOf(mod)) {
                return {
                  _tag: "OneOf",
                  id,
                  choice: mod.choice,
                  amount: mod.amount,
                } as const
              }
              if (Order.isExtras(mod)) {
                return {
                  _tag: "Extras",
                  id,
                  choices: A.fromIterable(mod.choices),
                } as const
              }

              throw absurd(mod)
            })
          ),
        })),
        HashMap.values,
        A.fromIterable
      ),
    })
  }

  const amount = Order.getOrderAmount(order)
  const cost = Order.getOrderCost(order)
  const items = Order.getOrderItems(order)

  const listItems = HashMap.mapWithIndex(items, (item, key) => (
    <OrderModalItem key={key} hash={key} dispatch={dispatch} orderItem={item} />
  ))

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-3 pb-16 bg-white rounded-t-xl overflow-auto">
        <h3 className="text-2xl rtl:mt-9">{t("yourOrder")}</h3>
        <hr className="w-1/2 mt-1 mb-2" />
        <div>
          <a.div style={{ height: h }}>
            <ul ref={ref} className="divide-y divide-emerald-400">
              {HashMap.values(listItems)}
            </ul>
          </a.div>
          <div className="h-8" />
          <button
            onClick={handleOrder}
            disabled={isLoading || amount === 0}
            className="btn w-full btn-primary"
          >
            <span className="badge badge-outline badge-ghost">{}</span>
            <span className="inline-block flex-grow px-3 text-left rtl:text-right">
              {isLoading ? t("loading") : t("order")}
            </span>
            <span className="tracking-wider font-light">{toShekel(cost)}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OrderModal
