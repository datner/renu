import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid"
import { decrement, increment } from "fp-ts/function"

export interface AmountButtonsProps {
  amount: number
  onChange(amount: number): void
  minimum: number
}

export function AmountButtons(props: AmountButtonsProps) {
  const { amount, onChange, minimum } = props

  return (
    <span className="relative w-full z-0 inline-flex rtl:flex-row-reverse shadow-sm rounded-md">
      <button
        type="button"
        onClick={() => amount > minimum && onChange(decrement(amount))}
        disabled={amount <= minimum}
        className="relative disabled:text-gray-300 inline-flex items-center bg-emerald-50 focus:bg-emerald-200 px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium text-emerald-500 focus:text-emerald-800 focus:z-10 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <span className="sr-only">Decrement</span>
        <MinusCircleIcon className="h-5 w-5 m-0.5" aria-hidden="true" />
      </button>
      <span className="relative basis-11 shrink-0 flex-grow inline-flex items-center justify-center px-2 py-2 border-y border-gray-300 bg-white text-sm font-medium text-gray-500">
        {amount}
      </span>
      <button
        type="button"
        onClick={() => onChange(increment(amount))}
        className="-ml-px relative inline-flex items-center px-2 py-2 bg-emerald-50 focus:bg-emerald-200 rounded-r-md border border-gray-300 text-sm font-medium text-emerald-500 focus:text-emerald-800 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
      >
        <span className="sr-only">Increment</span>
        <PlusCircleIcon className="h-5 w-5 m-0.5" aria-hidden="true" />
      </button>
    </span>
  )
}
