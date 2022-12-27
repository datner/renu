import { OrderItem } from "src/menu/jotai/order"
import { LabeledTextArea } from "src/core/components/LabeledTextArea"
import { toShekel } from "src/core/helpers/content"
import { max } from "src/core/helpers/number"
import { useZodForm } from "src/core/hooks/useZodForm"
import clsx from "clsx"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import { FormProvider, useController } from "react-hook-form"
import { head } from "fp-ts/NonEmptyArray"
import { some, none, getOrElse, match } from "fp-ts/Option"
import { ExtrasItem, getItemFormSchema, ItemForm, OneOfItem } from "../validations/item"
import { AmountButtons } from "./AmountButtons"
import { ModifiersBlock } from "./ModifiersBlock"
import { Extras, Modifier, OneOf } from "db/itemModifierConfig"
import { constant, identity, pipe, tuple } from "fp-ts/lib/function"
import { findFirst } from "fp-ts/Array"
import * as A from "fp-ts/Array"
import * as T from "fp-ts/Tuple"
import * as s from "fp-ts/string"
import * as RA from "fp-ts/ReadonlyArray"
import { last } from "fp-ts/Semigroup"
import * as RR from "fp-ts/ReadonlyRecord"
import * as O from "fp-ts/Option"
import * as N from "fp-ts/number"
import { useMemo } from "react"

interface ItemModalFormProps {
  options?: boolean
  order: OrderItem
  // Note on containerEl: this is a filthy dirty hack because I can't find a fuck to do it right
  containerEl: HTMLElement | null
  onSubmit(data: ItemForm): void
}

const OrderState = {
  NEW: "NEW",
  UPDATE: "UPDATE",
  REMOVE: "REMOVE",
} as const

type OrderState = typeof OrderState[keyof typeof OrderState]

const floorOne = max(1)

const oneOfs = RA.filterMap<Modifier, OneOf>((m) =>
  m.config._tag === "oneOf" ? some(m.config) : none
)

const extras = RA.filterMap<Modifier, Extras>((m) =>
  m.config._tag === "extras" ? some(m.config) : none
)

const makeDefaults = (order: OrderItem): ItemForm["modifiers"] => ({
  oneOf: RR.fromFoldableMap(last<OneOfItem>(), RA.Foldable)(oneOfs(order.item.modifiers), (of) => [
    of.identifier,
    {
      identifier: of.identifier,
      amount: 1,
      choice: pipe(
        order.modifiers,
        findFirst((m) => m.identifier === of.identifier && m._tag === "oneOf"),
        O.map((m) => m.choice),
        getOrElse(() =>
          pipe(
            of.options,
            findFirst((o) => o.default),
            O.map((o) => o.identifier),
            getOrElse(constant(head(of.options).identifier))
          )
        )
      ),
    },
  ]),
  extras: RR.fromFoldableMap(last<ExtrasItem>(), RA.Foldable)(
    extras(order.item.modifiers),
    (ex) => [
      ex.identifier,
      {
        identifier: ex.identifier,
        choices: RR.fromFoldableMap(last<number>(), RA.Foldable)(ex.options, (o) => [
          o.identifier,
          pipe(
            order.modifiers,
            RA.findFirst((m) => m.choice === o.identifier),
            match(
              () => 0,
              (m) => m.amount
            )
          ),
        ]),
      },
    ]
  ),
})

const foldToSumWithIndex = RR.foldMapWithIndex(s.Ord)(O.getMonoid(N.SemigroupSum))
const foldToSum = RR.foldMap(s.Ord)(O.getMonoid(N.SemigroupSum))

export function ItemModalForm(props: ItemModalFormProps) {
  const { order, onSubmit, containerEl } = props
  const t = useTranslations("menu.Components.ItemModal")
  const ItemForm = useMemo(() => getItemFormSchema(order.item.modifiers), [order])

  const form = useZodForm({
    schema: ItemForm,
    shouldFocusError: true,
    defaultValues: {
      comment: order.comment,
      amount: floorOne(order.amount),
      modifiers: makeDefaults(order),
    },
  })

  const { control, handleSubmit, formState, watch } = form

  const { isDirty } = formState

  const { field } = useController({ control, name: "amount" })
  const amount = field.value

  const orderState =
    order.amount > 0
      ? amount === 0 || !isDirty
        ? OrderState.REMOVE
        : OrderState.UPDATE
      : OrderState.NEW

  const submitOrRemove = handleSubmit(
    (data) => {
      onSubmit(
        orderState === OrderState.REMOVE
          ? { amount: 0, comment: "", modifiers: { oneOf: {}, extras: {} } }
          : data
      )
    },
    (e) => console.log(e)
  )

  const value = watch()

  const basePrice = value.amount * order.item.price

  const configs = pipe(
    order.item.modifiers,
    RA.map((m) => m.config)
  )

  // upgrade to something like
  // sequenceT(O.Apply)([markupOneOf, markupExtras, markupNewOne])
  const markup = pipe(
    tuple(value.modifiers.oneOf, value.modifiers.extras),
    T.bimap(
      foldToSum(({ identifier, choices }) =>
        pipe(
          configs,
          RA.findFirst((m): m is Extras => m._tag === "extras" && m.identifier === identifier),
          O.chain((mod) =>
            pipe(
              choices,
              foldToSumWithIndex((modId, amount) =>
                pipe(
                  mod.options,
                  A.findFirst((o) => o.identifier === modId),
                  O.map((m) => m.price * amount)
                )
              )
            )
          )
        )
      ),
      foldToSum(({ identifier, choice, amount }) =>
        pipe(
          configs,
          RA.findFirst((m): m is OneOf => m._tag === "oneOf" && m.identifier === identifier),
          O.chain((mod) =>
            pipe(
              mod.options,
              A.findFirst((o) => o.identifier === choice),
              O.map((m) => m.price * amount)
            )
          )
        )
      )
    ),
    RA.foldMap(O.getMonoid(N.MonoidSum))(identity),
    O.getOrElse(() => 0)
  )

  const price = basePrice + markup

  return (
    <form id="item-form" onSubmit={submitOrRemove}>
      <FormProvider {...form}>
        <ModifiersBlock modifiers={order.item.modifiers ?? []} />
        <div className="mt-4">
          <LabeledTextArea label={t("comment")} name="comment" rows={4} />
        </div>
      </FormProvider>
      {containerEl &&
        createPortal(
          <div className="mt-6 z-20 sticky bottom-4 mx-2 flex gap-2">
            <div className="basis-32">
              <AmountButtons
                minimum={order.amount > 0 ? 0 : 1}
                amount={amount}
                onChange={field.onChange}
              />
            </div>
            <button
              form="item-form"
              type="submit"
              className={clsx(
                "inline-flex grow justify-center items-center rounded-md border border-transparent shadow-sm px-2 sm:px-4 py-2 text-xs whitespace-nowrap font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2  sm:text-base",
                orderState === OrderState.REMOVE
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
              )}
            >
              <CallToActionText price={price} multi={order.amount > 1} orderState={orderState} />
            </button>
          </div>,
          containerEl
        )}
    </form>
  )
}

interface CallToActionTextProps {
  price: number
  orderState: OrderState
  multi: boolean
}

function CallToActionText(props: CallToActionTextProps) {
  const { price, orderState, multi } = props
  const t = useTranslations("menu.Components.CallToActionText")
  switch (orderState) {
    case OrderState.NEW:
      return (
        <>
          <span className="inline-block text-left rtl:text-right font-medium flex-grow">
            {t("new")}
          </span>
          <span className="tracking-wider">{toShekel(price)}</span>
        </>
      )

    case OrderState.UPDATE:
      return (
        <>
          <span className="inline-block rtl:text-right font-medium flex-grow">{t("update")}</span>
          <span className="tracking-wider">{toShekel(price)}</span>
        </>
      )

    case OrderState.REMOVE:
      return (
        <span className="inline-block rtl:text-right font-medium flex-grow">
          {t("remove._")} {multi && t("remove.all")}
        </span>
      )
  }
}
