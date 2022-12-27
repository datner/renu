import { RadioGroup } from "@headlessui/react"
import { toShekel } from "src/core/helpers/content"
import clsx from "clsx"
import { constNull } from "fp-ts/function"
import { none, some, matchW } from "fp-ts/Option"
import { useState } from "react"

const sides = [
  { id: none, name: "None", price: none },
  { id: some(1), name: "Chips", price: none },
  { id: some(2), name: "Okra", price: some(400) },
  { id: some(3), name: "Salad", price: none },
  { id: some(4), name: "Beans", price: none },
]

const additionalPrice = matchW<null, number, JSX.Element>(constNull, (price) => (
  <span className="text-gray-500">+ {toShekel(price)}</span>
))

export function SideDishExtra() {
  const [value, setValue] = useState(none)

  return (
    <RadioGroup as="fieldset" value={value} onChange={setValue}>
      <RadioGroup.Label as="legend" className="text-lg text-gray-700">
        Sides
      </RadioGroup.Label>
      <div className="divide-y mt-4 divide-gray-200 border-y border-gray-200">
        {sides.map(({ id, name, price }) => (
          <RadioGroup.Option
            as="label"
            key={name}
            value={id}
            className="relative flex items-center justify-center py-4 group"
          >
            {({ checked }) => (
              <>
                <div className="mr-3 flex h-6 w-6 items-center">
                  <input
                    readOnly
                    type="radio"
                    checked={checked}
                    className="border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <div className="min-w-0 flex flex-1 text-sm">
                  <span
                    className={clsx(
                      "select-none font-medium",
                      checked ? "text-emerald-600 font-bold" : "text-gray-700"
                    )}
                  >
                    {name}
                  </span>
                </div>
                <div className="ml-3 flex h-5 items-center">{additionalPrice(price)}</div>
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  )
}
