import { OneOf, OneOfOption } from "db/itemModifierConfig"
import { ReactNode, useMemo } from "react"
import { pipe } from "fp-ts/function"
import { getLabel } from "./helpers"
import { useLocale } from "src/core/hooks/useLocale"
import { Locale } from "db"
import { map } from "fp-ts/Array"
import * as R from "fp-ts/Reader"
import * as IO from "fp-ts/IO"
import { useFormContext, UseFormRegisterReturn } from "react-hook-form"
import { ItemForm } from "../validations/item"

import { toShekel } from "src/core/helpers/content"

type Props = {
  modifier: OneOf
}

const radio = (options: OneOfOption[]) =>
  pipe(
    R.ask<{ register: IO.IO<UseFormRegisterReturn>; locale: Locale }>(),
    R.map(({ register, locale }) =>
      pipe(
        options,
        map<OneOfOption, ReactNode>((o) => (
          <label key={o.identifier} className="label cursor-pointer justify-start gap-2">
            <input
              {...register()}
              type="radio"
              defaultChecked={o.default}
              className="radio radio-primary grow-0"
              value={o.identifier}
            />
            <span className="label-text grow">{getLabel(o)(locale)}</span>
            {o.price > 0 && <span className="label-text">{toShekel(o.price)}</span>}
          </label>
        ))
      )
    )
  )

export const OneOfComponent = (props: Props) => {
  const { modifier } = props
  const { register } = useFormContext<ItemForm>()
  const locale = useLocale()
  const radiofields = useMemo(() => radio(modifier.options), [modifier])
  return (
    <div className="field-control">
      <label className="label">
        <span className="label-text">{getLabel(modifier)(locale)}</span>
      </label>
      {radiofields({
        register: () => register(`modifiers.oneOf.${modifier.identifier}.choice`),
        locale,
      })}
    </div>
  )
}
OneOfComponent.displayName = "OneOf"
