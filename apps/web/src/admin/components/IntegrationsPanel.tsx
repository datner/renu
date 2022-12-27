import { useQuery } from "@blitzjs/rpc"
import { flow, pipe } from "fp-ts/function"
import * as L from "monocle-ts/Lens"
import * as Op from "monocle-ts/Optional"
import * as Eq from "fp-ts/Eq"
import * as E from "fp-ts/Either"
import * as A from "fp-ts/Array"
import * as RA from "fp-ts/ReadonlyArray"
import * as O from "fp-ts/Option"
import { match, P } from "ts-pattern"
import { Reducer, Suspense, useCallback, useEffect, useReducer } from "react"
import { ManagementIntegration } from "@prisma/client"
import getManagementMenu from "src/management/queries/getManagementMenu"
import { ExclamationTriangleIcon, ServerStackIcon } from "@heroicons/react/24/outline"
import { XCircleIcon } from "@heroicons/react/24/solid"
import {
  Identified,
  ManagementCategory,
  ManagementItem,
  ManagementMenu,
  ManagementModifier,
  ManagementModifierOption,
} from "integrations/management/types"
import { useFieldArray, useFormContext, UseFormGetValues } from "react-hook-form"
import { ItemSchema, ModifierSchema, OptionsSchemaArray } from "src/items/validations"
import { useLocale } from "src/core/hooks/useLocale"
import { matchSorter } from "match-sorter"
import { AutocompleteCategory, AutocompleteOption, NullableAutocomplete } from "./Autocomplete"

export function IntegrationsPanel() {
  return (
    <Suspense fallback="loading integration...">
      <Integrations />
    </Suspense>
  )
}

const eqIdentified = <A extends Identified>() =>
  Eq.fromEquals<A | null>((a, b) => a?.name === b?.name && a?.id === b?.id)

const eqManagementItem = eqIdentified<ManagementItem>()

function Integrations() {
  const [managementMenu] = useQuery(getManagementMenu, null)

  return pipe(
    managementMenu,
    E.fold(
      (e) =>
        match(e)
          .with({ tag: P.union("BreakerError", "HttpServerError") }, () => (
            <div className="flex flex-col min-h-0 grow items-center justify-center">
              <div className="alert alert-error shadow-lg max-w-md">
                <div>
                  <ServerStackIcon className="shrink-0 h-6 w-6" />
                  <span>
                    {"Error! It seems we can't reach Dorixs' servers. Please try again later..."}
                  </span>
                </div>
              </div>
            </div>
          ))
          .with({ tag: "ManagementMismatchError" }, (e) => (
            <div className="flex flex-col min-h-0 grow items-center justify-center">
              <div className="alert alert-warning shadow-lg max-w-md">
                <div>
                  <ExclamationTriangleIcon className="shrink-0 h-6 w-6" />
                  <span>
                    Warning! Management Integration is mismatched. Expected {e.needed} configuration
                    but received
                    {e.given} configuration
                  </span>
                </div>
              </div>
            </div>
          ))
          .otherwise(() => (
            <div className="flex flex-col min-h-0 grow items-center justify-center">
              <div className="alert alert-error shadow-lg max-w-md">
                <div>
                  <XCircleIcon className="shrink-0 h-6 w-6" />
                  <span>
                    Error! Something went wrong along the way, please reach out to a Renu admin to
                    resolve this issue
                  </span>
                </div>
              </div>
            </div>
          )),
      (props) => <IntegrationMenu {...props} />
    )
  )
}

type Props = {
  integration: ManagementIntegration
  menu: ManagementMenu
}

const useItemSuggestions = (categories: ManagementCategory[]) =>
  useCallback(
    (query: string) =>
      pipe(
        matchSorter(categories, query, { keys: ["name", "items.*.name"] }),
        A.filterMap((category) =>
          A.isNonEmpty(category.items)
            ? O.some(
                <AutocompleteCategory key={category.id + category.name} title={category.name}>
                  {pipe(
                    matchSorter(category.items, query, { keys: ["name"] }),
                    A.filterMap((it) =>
                      it.id != null
                        ? O.some(
                            <AutocompleteOption
                              key={category.name + it.id + it.name}
                              value={it}
                              displayValue={(i) => i.name}
                            />
                          )
                        : O.none
                    )
                  )}
                </AutocompleteCategory>
              )
            : O.none
        )
      ),
    [categories]
  )

const useModifierSuggestions = (modifiers: ManagementModifier[]) =>
  useCallback(
    (query: string) =>
      pipe(
        matchSorter(modifiers, query, { keys: ["name", "items.*.name"] }),
        A.filterMap((modifier) =>
          A.isNonEmpty(modifier.options)
            ? O.some(
                <AutocompleteCategory key={modifier.id + modifier.name} title={modifier.name}>
                  {pipe(
                    matchSorter(modifier.options, query, { keys: ["name"] }),
                    A.filterMap((it) =>
                      it.id != null
                        ? O.some(
                            <AutocompleteOption
                              key={modifier.name + it.id + it.name}
                              value={it}
                              displayValue={(it) => it.name}
                            />
                          )
                        : O.none
                    )
                  )}
                </AutocompleteCategory>
              )
            : O.none
        )
      ),
    [modifiers]
  )

type Action =
  | { action: "SET_ITEM"; item: ManagementItem | null }
  | {
      action: "SET_OPTION"
      pos: [number, number]
      option: ManagementModifierOption | null
    }
  | { action: "COMMIT_CHANGES" }
  | { action: "INIT"; state: State }

type State = {
  readonly item: ManagementItem | null
  readonly modifiers: ManagementModifier[]
  readonly options: ReadonlyArray<ReadonlyArray<ManagementModifierOption | null>>
  readonly _initial: Pick<State, "item" | "options">
  readonly dirty: boolean
}

const stateL = L.id<State>()

const itemLens = pipe(stateL, L.prop("item"))

const modifierLens = pipe(stateL, L.prop("modifiers"))

const optionPos = ([i1, i2]: [number, number]) =>
  pipe(stateL, L.prop("options"), L.index(i1), Op.index(i2))

const updateDirty = (state: State) =>
  pipe(
    stateL,
    L.prop("dirty"),
    L.modify(() => !eqDirty.equals(state._initial, state))
  )(state)

const resetInitial = pipe(
  stateL,
  L.modify((state) => ({ ...state, _initial: { item: state.item, options: state.options } }))
)

const reducer: Reducer<State, Action> = (state, action) =>
  pipe(
    state,
    match(action)
      .with({ action: "SET_ITEM" }, ({ item }) =>
        flow(itemLens.set(item), modifierLens.set(item?.modifiers ?? []))
      )
      .with({ action: "SET_OPTION" }, ({ option, pos: [modifierIndex, optionIndex] }) =>
        flow(optionPos([modifierIndex, optionIndex]).set(option))
      )
      .with({ action: "COMMIT_CHANGES" }, () => resetInitial)
      .with({ action: "INIT" }, ({ state }) => stateL.set(state))
      .exhaustive(),
    updateDirty
  )

const createState: (getValues: UseFormGetValues<ItemSchema>) => (menu: ManagementMenu) => State =
  (getValues) => (menu) => {
    const [managementId, formModifiers] = getValues(["managementId", "modifiers"])
    const item = managementId
      ? pipe(
          menu.categories,
          RA.chain((c) => c.items),
          RA.findFirst((i) => i.id === managementId)
        )
      : O.none

    const modifiers = pipe(
      item,
      O.map((i) => i.modifiers),
      O.getOrElse(() => [] as ManagementModifier[])
    )
    const options = pipe(
      formModifiers,
      RA.map((m) =>
        pipe(
          m.config.options as OptionsSchemaArray,
          RA.map((o) =>
            pipe(
              modifiers,
              A.chain((m) => m.options),
              A.filter((mod) => Boolean(mod.id)),
              A.findFirst((mod) => mod.id === o.managementId),
              O.toNullable
            )
          )
        )
      )
    )
    return {
      item: O.toNullable(item),
      modifiers,
      options,
      _initial: { item: O.toNullable(item), options },
      dirty: false,
    }
  }

type DeepReadonlyArrayImpl<A> = A extends Array<infer U>
  ? ReadonlyArray<U>
  : A extends object
  ? { [K in keyof A]: DeepReadonlyArrayImpl<A[K]> }
  : A
type DeepReadonlyArray<A> = ReadonlyArray<
  A extends object ? { [K in keyof A]: DeepReadonlyArrayImpl<A[K]> } : A
>

const managementIdOf = ([i1, i2]: [number, number]) =>
  pipe(
    L.id<DeepReadonlyArray<ModifierSchema>>(),
    L.index(i1),
    Op.prop("config"),
    Op.prop("options"),
    Op.index(i2),
    Op.prop("managementId")
  )

const eqDirty = Eq.struct<Pick<State, "item" | "options">>({
  item: eqIdentified(),
  options: RA.getEq(RA.getEq(eqIdentified())),
})

function IntegrationMenu(props: Props) {
  const { menu /* integration */ } = props
  const { watch, control, register, setValue, getValues } = useFormContext<ItemSchema>()
  const { replace, fields } = useFieldArray({ control, name: "modifiers" })
  const [state, dispatch] = useReducer(reducer, menu, createState(getValues))

  const { modifiers, item, dirty } = state

  const locale = useLocale()
  const createSuggestions = useItemSuggestions(menu.categories)
  const createModifierSuggestions = useModifierSuggestions(modifiers)

  useEffect(
    () =>
      watch((_, info) => {
        if (!info.name) {
          dispatch({ action: "INIT", state: createState(getValues)(menu) })
        }
      }).unsubscribe,
    [getValues, menu, watch]
  )

  const handleCommit = () => {
    setValue("managementId", item?.id)
    const newFields = pipe(
      RA.fromArray(fields),
      RA.map(({ id, ...f }) => f),
      RA.chainWithIndex((i1, f) =>
        pipe(
          RA.fromArray(f.config.options),
          RA.mapWithIndex((i2) =>
            pipe(
              optionPos([i1, i2]).getOption(state),
              O.chainNullableK((o) => o?.id),
              O.toNullable,
              managementIdOf([i1, i2]).set
            )
          )
        )
      ),
      RA.reduce(fields as DeepReadonlyArray<ModifierSchema>, (fs, f) => f(fs))
    )
    replace(newFields as ModifierSchema[])
    dispatch({ action: "COMMIT_CHANGES" })
  }

  return (
    <div className="p-4 space-y-4 grow flex flex-col min-h-0 overflow-auto">
      <div className="grid grid-cols-3 items-start">
        <h3 className="text-lg font-medium leading-6 pt-2">{watch(`${locale}.name`)}</h3>
        <div className="col-span-2">
          <div className="max-w-xs">
            <input {...register("managementId")} className="hidden" />
            <NullableAutocomplete
              value={item}
              onChange={(item) => dispatch({ action: "SET_ITEM", item })}
              by={eqManagementItem.equals}
              createSuggestions={createSuggestions}
              displayValue={flow(
                O.fromNullable,
                O.map((i) => i.name),
                O.getOrElse(() => "")
              )}
            />
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="space-y-8 divide-y">
        {pipe(
          watch("modifiers"),
          A.mapWithIndex((modifierIndex, m) => (
            <div key={m.config.identifier}>
              <h3>{m.config.content[locale].name}</h3>
              <div className="space-y-8">
                {pipe(
                  m.config.options as OptionsSchemaArray,
                  A.mapWithIndex((optionIndex, op) => (
                    <div key={op.identifier} className="grid grid-cols-3">
                      <input
                        {...register(
                          `modifiers.${modifierIndex}.config.options.${optionIndex}.managementId`
                        )}
                        className="hidden"
                      />
                      <h3 className="text-lg font-medium leading-6 pt-2">
                        {op.content[locale].name}
                      </h3>
                      <div className="col-span-2">
                        <div className="max-w-xs">
                          <NullableAutocomplete
                            onChange={(option) =>
                              dispatch({
                                action: "SET_OPTION",
                                pos: [modifierIndex, optionIndex],
                                option,
                              })
                            }
                            disabled={A.isEmpty(modifiers)}
                            value={pipe(
                              optionPos([modifierIndex, optionIndex]).getOption(state),
                              O.toNullable
                            )}
                            displayValue={flow(
                              O.fromNullable,
                              O.map((i) => i.name),
                              O.getOrElse(() => "")
                            )}
                            createSuggestions={createModifierSuggestions}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="divider" />
      <div>
        <button type="button" disabled={!dirty} onClick={handleCommit} className="btn btn-primary">
          update Integration
        </button>
      </div>
    </div>
  )
}
