import { LabeledTextArea } from "src/core/components/LabeledTextArea"
import { toShekel } from "src/core/helpers/content"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import {
  FormProvider,
  useController,
  useForm,
  DefaultValues,
  useWatch,
  useFormContext,
  useFormState,
} from "react-hook-form"
import { ItemForm } from "../validations/item"
import { AmountButtons } from "./AmountButtons"
import { pipe } from "@effect/data/Function"
import * as A from "@effect/data/ReadonlyArray"
import * as RR from "@effect/data/ReadonlyRecord"
import * as O from "@effect/data/Option"
import * as E from "@effect/data/Either"
import * as N from "@effect/data/Number"
import * as HashMap from "@effect/data/HashMap"
import * as Order from "src/menu/hooks/useOrder"
import * as _Menu from "src/menu/schema"
import { useMemo } from "react"
import { Modifiers } from "database-helpers"
import { ModifiersBlock } from "./ModifiersBlock"

interface ItemModalFormProps {
  order: O.Option<Order.OrderItem>
  item: _Menu.Item
  // Note on containerEl: this is a filthy dirty hack because I can't find a fuck to do it right
  containerEl: HTMLElement | null
  onSubmit(data: ItemForm): void
}

const OrderState = {
  NEW: "NEW",
  UPDATE: "UPDATE",
  REMOVE: "REMOVE",
} as const

type OrderState = (typeof OrderState)[keyof typeof OrderState]

export const partitionModifiers = E.liftPredicate(
  (mod: _Menu.ItemModifier): mod is _Menu.ItemModifier<Modifiers.OneOf> =>
    mod.config._tag === "oneOf",
  (mod) => mod as _Menu.ItemModifier<Modifiers.Extras>
)

const makeDefaults = (item: _Menu.Item): DefaultValues<ItemFieldValues["modifiers"]> => {
  const [extras, oneOfs] = A.partitionMap(item.modifiers, partitionModifiers)
  return {
    oneOf: Object.fromEntries(
      A.map(oneOfs, (oneOf) => [
        oneOf.id,
        {
          identifier: oneOf.config.identifier,
          amount: 1,
          choice: pipe(
            A.findFirst(oneOf.config.options, (o) => o.default),
            O.map((o) => o.identifier),
            O.getOrElse(() => A.headNonEmpty(oneOf.config.options).identifier)
          ),
        },
      ])
    ),
    extras: Object.fromEntries(
      A.map(extras, (ex) => [
        ex.id,
        {
          identifier: ex.config.identifier,
          choices: Object.fromEntries(A.map(ex.config.options, (o) => [o.identifier, 0])),
        },
      ])
    ),
  }
}

const makeOrderDefaults = (order: Order.OrderItem): DefaultValues<ItemFieldValues["modifiers"]> => {
  const [allExtras, oneOfs] = A.partitionMap(order.item.modifiers, partitionModifiers)
  return {
    oneOf: Object.fromEntries(
      A.map(oneOfs, (oneOf) => [
        oneOf.id,
        {
          identifier: oneOf.config.identifier,
          amount: 1,
          choice: pipe(
            HashMap.get(order.modifiers, oneOf.id),
            O.filter(Order.isOneOf),
            O.map((o) => o.choice),
            O.orElse(() =>
              O.map(
                A.findFirst(oneOf.config.options, (o) => o.default),
                (o) => o.identifier
              )
            ),
            O.getOrElse(() => A.headNonEmpty(oneOf.config.options).identifier)
          ),
        },
      ])
    ),
    extras: Object.fromEntries(
      A.map(allExtras, (ex) => [
        ex.id,
        {
          identifier: ex.config.identifier,
          choices: Object.fromEntries(
            A.zip(
              A.map(ex.config.options, (o) => o.identifier),
              A.map(ex.config.options, (o) =>
                pipe(
                  HashMap.get(order.modifiers, ex.id),
                  O.filter(Order.isExtras),
                  O.flatMap((m) => HashMap.get(m.choices, o.identifier)),
                  O.getOrElse(() => 0)
                )
              )
            )
          ),
        },
      ])
    ),
  }
}

export interface ItemFieldValues {
  comment: string
  amount: number
  modifiers: {
    oneOf: Record<
      _Menu.ItemModifierId,
      {
        amount: number
        identifier: string
        choice: string
      }
    >
    extras: Record<
      _Menu.ItemModifierId,
      {
        identifier: string
        choices: Record<string, number>
      }
    >
  }
}

export function ItemModalForm(props: ItemModalFormProps) {
  const { order, item, onSubmit, containerEl } = props
  const t = useTranslations("menu.Components.ItemModal")

  const defaultValues = useMemo<DefaultValues<ItemFieldValues>>(
    () =>
      O.match(
        order,
        () => ({
          comment: "",
          amount: 1,
          modifiers: makeDefaults(item),
        }),
        (o) => ({
          comment: o.comment,
          amount: Order.getAmount(o),
          modifiers: makeOrderDefaults(o),
        })
      ),
    [order, item]
  )

  const form = useForm<ItemFieldValues>({
    defaultValues,
  })

  const { handleSubmit, control, formState } = form

  const { isDirty } = formState

  const { field } = useController({ control, name: "amount" })
  const amount = field.value

  const submitOrRemove = handleSubmit(
    (data) => {
      onSubmit(
        O.isSome(order) && (amount === 0 || !isDirty)
          ? { amount: 0, comment: "", modifiers: { oneOf: {}, extras: {} } }
          : data
      )
    },
    (e) => console.log(e)
  )

  const modifiers = useMemo(
    () =>
      pipe(
        item.modifiers,
        A.map((m) => [m.id, m] as const),
        HashMap.fromIterable
      ),
    [item]
  )

  return (
    <form id="item-form" onSubmit={submitOrRemove}>
      <FormProvider {...form}>
        <ModifiersBlock modifiers={item.modifiers} />
        <div className="mt-4">
          <LabeledTextArea label={t("comment")} name="comment" rows={4} />
        </div>
        {containerEl &&
          createPortal(
            <div className="mt-6 z-20 sticky bottom-4 mx-4 flex gap-2">
              <div className="basis-32">
                <AmountButtons
                  // Number(true) === 1, Number(false) === 0
                  minimum={Number(O.isNone(order))}
                  amount={amount}
                  onIncrement={() => field.onChange(amount + 1)}
                  onDecrement={() => field.onChange(amount - 1)}
                />
              </div>
              <SubmitButton isCreate={O.isNone(order)} price={item.price} modifierMap={modifiers} />
            </div>,
            containerEl
          )}
      </FormProvider>
    </form>
  )
}

interface SubmitButtonProps {
  price: number
  isCreate?: boolean
  modifierMap: HashMap.HashMap<_Menu.ItemModifierId, _Menu.ItemModifier>
}

function SubmitButton(props: SubmitButtonProps) {
  const { price, isCreate, modifierMap } = props
  const t = useTranslations("menu.Components.CallToActionText")
  const { control } = useFormContext<ItemForm>()
  const { isDirty } = useFormState({ control })

  const [amount, oneOfs, extrases] = useWatch({
    control,
    name: ["amount", "modifiers.oneOf", "modifiers.extras"],
  })
  const multi = amount > 1
  const isUpdate = amount > 0 && isDirty

  const orderState = isCreate ? OrderState.NEW : isUpdate ? OrderState.UPDATE : OrderState.REMOVE

  const oneOf = RR.collect(oneOfs, (id, { choice, amount }) =>
    pipe(
      modifierMap,
      HashMap.get(_Menu.ItemModifierId(Number(id))),
      O.map((o) => o.config),
      O.filter(Modifiers.isOneOf),
      O.flatMap((m) => A.findFirst(m.options, (o) => o.identifier === choice)),
      O.map((o) => o.price * amount),
      O.getOrElse(() => 0)
    )
  )

  const extras = RR.collect(extrases, (id, { choices }) =>
    pipe(
      modifierMap,
      HashMap.get(_Menu.ItemModifierId(Number(id))),
      O.map((m) => m.config),
      O.filter(Modifiers.isExtras),
      O.map((ex) =>
        RR.collect(choices, (choice, amount) =>
          pipe(
            A.findFirst(ex.options, (o) => o.identifier === choice),
            O.map((o) => o.price * amount)
          )
        )
      ),
      O.map(O.sumCompact),
      O.getOrElse(() => 0)
    )
  )

  // upgrade to something like
  // sequenceT(O.Apply)([markupOneOf, markupExtras, markupNewOne])
  const total = N.sumAll([price, ...oneOf, ...extras]) * amount

  switch (orderState) {
    case OrderState.NEW:
      return (
        <button form="item-form" type="submit" className="btn grow px-2 btn-primary">
          <span className="inline-block text-left rtl:text-right grow xs:grow-0 xs:mx-1.5">
            {t("add")}
          </span>{" "}
          <span className="hidden xs:inline-block text-left rtl:text-right grow">
            {t("to order")}
          </span>
          <span className="tracking-wider font-light">{toShekel(total)}</span>
        </button>
      )

    case OrderState.UPDATE:
      return (
        <button form="item-form" type="submit" className="btn grow px-2 btn-primary">
          <span className="inline-block rtl:text-right flex-grow">{t("update")}</span>
          <span className="tracking-wider font-light">{toShekel(total)}</span>
        </button>
      )

    case OrderState.REMOVE:
      return (
        <button form="item-form" type="submit" className="btn grow px-2 btn-error">
          <span className="inline-block text-center font-medium flex-grow">
            {t("remove._")} {multi && t("remove.all")}
          </span>
        </button>
      )
  }
}
