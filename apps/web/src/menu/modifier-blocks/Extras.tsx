import { Transition } from "@headlessui/react"
import { ExtrasOption, Extras } from "db/itemModifierConfig"
import { useState } from "react"
import { getLabel } from "./helpers"
import { useLocale } from "src/core/hooks/useLocale"
import { Locale } from "db"
import { useController, useFormContext, useFormState } from "react-hook-form"
import { ItemForm } from "../validations/item"
import { constFalse, constNull, identity, pipe } from "fp-ts/function"
import * as s from "fp-ts/string"
import * as n from "fp-ts/number"
import * as O from "fp-ts/Option"
import * as Ord from "fp-ts/Ord"
import * as RR from "fp-ts/Record"
import { useTranslations } from "next-intl"
import { toShekel } from "src/core/helpers/content"
import { useTimeout } from "@mantine/hooks"
import { AmountCounter } from "../components/AmountCounter"

type Props = {
  modifier: Extras
}

const optNumberLt = pipe(n.Ord, O.getOrd, Ord.lt)

const ExtrasCheck = ({
  option,
  locale,
  name,
  maxReached,
}: {
  option: ExtrasOption
  locale: Locale
  name: string
  maxReached: boolean
}) => {
  const { field } = useController({ name })
  const handleChange = () => {
    changeValue(field.value > 0 ? 0 : 1)
  }
  const handleClick = () => {
    const surplus = maxReached ? 0 : 1
    const value = option.multi ? field.value + surplus : field.value > 0 ? 0 : surplus

    changeValue(value)
  }
  const [show, setShow] = useState(field.value > 0 && option.multi)
  const { start, clear } = useTimeout(() => setShow(false), 1600)
  const changeValue = (value: number) => {
    field.onChange(value)
    clear()
    if (value > 0 && option.multi) {
      setShow(true)
      return start()
    }
    setShow(false)
  }

  return (
    <div key={option.identifier} className="label relative gap-1 justify-start">
      <input
        id={`checkbox-${option.identifier}`}
        disabled={field.value === 0 && maxReached}
        checked={field.value > 0}
        type="checkbox"
        className="checkbox checkbox-primary z-20 rtl:-scale-x-100"
        onChange={handleChange}
      />
      <div className="absolute inset-0 z-10" onClick={handleClick} />
      <label htmlFor={`checkbox-${option.identifier}`} className="label-text grow">
        <AmountCounter label={getLabel(option)(locale)} amount={field.value} />
      </label>
      {option.price > 0 && (
        <span className="label-text">{toShekel(option.price * Math.max(1, field.value))}</span>
      )}
      <Transition
        show={show}
        className="absolute ltr:right-0 rtl:left-0 z-20"
        leave="transition-all duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
      >
        <div className="btn-group rtl:flex-row-reverse bg-white">
          <button
            disabled={maxReached}
            type="button"
            className="btn btn-primary btn-sm w-10"
            onClick={() => changeValue(field.value + 1)}
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm w-10"
            onClick={() => changeValue(Math.max(0, field.value - 1))}
          >
            -
          </button>
        </div>
      </Transition>
    </div>
  )
}

const foldSum = RR.foldMap(s.Ord)(n.MonoidSum)

export const ExtrasComponent = (props: Props) => {
  const { modifier } = props
  const locale = useLocale()
  const t = useTranslations("menu.Components.Extras")
  const { field, fieldState } = useController<ItemForm, `modifiers.extras.${string}`>({
    name: `modifiers.extras.${modifier.identifier}`,
  })

  const currentAmount = pipe(field.value.choices, foldSum(identity))

  const maxReached = pipe(
    modifier.max,
    O.fold(constFalse, (max) => Ord.geq(n.Ord)(currentAmount, max))
  )

  const minText = pipe(
    modifier.min,
    O.map((min) => t("min", { min }))
  )
  const maxText = pipe(
    modifier.max,
    O.map((max) => t("max", { max }))
  )
  const minMaxText = pipe(
    O.sequenceArray([minText, maxText]),
    O.fold(constNull, (txts) => txts.join(" "))
  )

  // types here are fucked, can't create an optic for it
  const errorText = pipe(
    fieldState.error,
    O.fromNullable,
    O.chainNullableK((o) => o?.message),
    O.fold(constNull, () => <span className="text-error">{t("error")}</span>)
  )

  return (
    <fieldset ref={field.ref} tabIndex={0} className="form-control">
      <legend className="label w-full">
        <p className="label-text">
          {getLabel(modifier)(locale)}
          <br />
          {minMaxText}
          <br />
          {errorText}
        </p>
      </legend>
      {modifier.options.map((o) => (
        <ExtrasCheck
          maxReached={maxReached}
          key={o.identifier}
          locale={locale}
          option={o}
          name={`modifiers.extras.${modifier.identifier}.choices.${o.identifier}`}
        />
      ))}
    </fieldset>
  )
}
ExtrasComponent.displayName = "Extras"
