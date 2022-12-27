import { Combobox } from "@headlessui/react"
import { ByComparator } from "@headlessui/react/dist/types"
import { CheckIcon } from "@heroicons/react/20/solid"
import { ChevronUpDownIcon } from "@heroicons/react/24/solid"
import { useElementSize } from "@mantine/hooks"
import { ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react"

type NullableAutocompleteProps<A> = {
  value: A | null
  displayValue(v: A | null): string
  by?: ByComparator<A | null>
  onChange(v: A | null): void
  disabled?: boolean
  createSuggestions(query: string): JSX.Element[]
}

type AutocompleteCategoryProps = {
  title: string
  children: ReactNode[]
}

type AutocompleteOptionProps<A = {}[] | undefined> = {
  value: A
  displayValue: (v: A) => string
}

export function AutocompleteOption<A>(props: AutocompleteOptionProps<A>) {
  const { value, displayValue } = props
  return (
    <Combobox.Option
      value={value}
      className="relative select-none py-2 px-3 text-gray-900 ui-active:bg-emerald-600 ui-active:text-white ui-selected:font-bold flex items-center"
    >
      <span className="grow">{displayValue(value)}</span>
      <CheckIcon className="h-5 w-5 invisible ui-selected:visible ui-active:text-white text-emerald-600" />
    </Combobox.Option>
  )
}

export const AutocompleteCategory = (props: AutocompleteCategoryProps) => (
  <div>
    <div className="divider text-emerald-800">{props.title}</div>
    {props.children}
  </div>
)

export function NullableAutocomplete<A>(props: NullableAutocompleteProps<A>) {
  const { displayValue, onChange, by, value, createSuggestions, disabled } = props
  const { ref, width } = useElementSize()
  const [setQuery, query, suggestions] = useSuggestions(createSuggestions)
  useEffect(() => {
    // when value changes (on select or on form reset), clear the query
    setQuery("")
  }, [value, setQuery])

  return (
    <Combobox
      as="div"
      ref={ref}
      by={by}
      value={value}
      onChange={onChange}
      disabled={disabled}
      nullable
      className="relative"
    >
      <Combobox.Input
        className="input w-full input-bordered h-9"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        displayValue={displayValue}
      />
      <Combobox.Button className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex items-center pr-2">
        <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
      </Combobox.Button>
      <Combobox.Options
        style={{ width }}
        className="absolute z-10 mt-3 h-60 w-72 overflow-auto min-w-max rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        {suggestions}
      </Combobox.Options>
    </Combobox>
  )
}

export function useSuggestions<A>(createSuggestions: (query: string) => A) {
  const [query, setQuery] = useState("")
  const defferedQuery = useDeferredValue(query)
  const suggestions = useMemo(
    () => createSuggestions(defferedQuery),
    [defferedQuery, createSuggestions]
  )
  return [setQuery, query, suggestions] as const
}
