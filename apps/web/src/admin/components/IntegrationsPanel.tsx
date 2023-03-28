import { useQuery } from "@blitzjs/rpc";
import {  flow, pipe } from "fp-ts/function";
import * as S from "@effect/data/String";
import * as Parser from "@effect/schema/Parser";
import * as Equivalence from "@effect/data/typeclass/Equivalence";
import * as Optic from "@fp-ts/optic";
import * as A from "@effect/data/ReadonlyArray";
import * as O from "@effect/data/Option";
import { match } from "ts-pattern";
import { Reducer, Suspense, useCallback, useEffect, useReducer } from "react";
import { ManagementIntegration } from "database";
import getManagementMenu from "src/management/queries/getManagementMenu";
import * as Management from "@integrations/management";
import {
  useFieldArray,
  useFormContext,
  UseFormGetValues,
} from "react-hook-form";
import {
  ItemSchema,
  ModifierSchema,
  OptionsSchemaArray,
} from "src/items/validations";
import { useLocale } from "src/core/hooks/useLocale";
import { matchSorter } from "match-sorter";
import {
  AutocompleteCategory,
  AutocompleteOption,
  NullableAutocomplete,
} from "./Autocomplete";

export function IntegrationsPanel() {
  return (
    <Suspense fallback="loading integration...">
      <Integrations />
    </Suspense>
  );
}

const eqIdentified = <A extends Management.Identified>() =>
  Equivalence.make<A>((a, b) =>
    S.Equivalence(a.name, b.name) && a.id === b.id
  );

const eqManagementItem_ = eqIdentified<Management.Item>();

const eqManagementItem = (
  a: Management.Item | null,
  b: Management.Item | null,
) => {
  if (a === a) return true;
  if (a === null || b === null) return false;
  return eqManagementItem_(a, b);
};

const eqManagementModifierOption_ = eqIdentified<Management.ModifierOption>();

const eqManagementModifierOption = (
  a: Management.ModifierOption | null,
  b: Management.ModifierOption | null,
) => {
  if (a === a) return true;
  if (a === null || b === null) return false;
  return eqManagementModifierOption_(a, b);
};

function Integrations() {
  const [managementMenu] = useQuery(getManagementMenu, null, {
    select: (data) => ({
      menu: Parser.decode(Management.Menu)(data.menu),
      integration: data.integration,
    }),
  });

  return <IntegrationMenu {...managementMenu} />;

  // return pipe(
  //           <div className="flex flex-col min-h-0 grow items-center justify-center">
  //             <div className="alert alert-error shadow-lg max-w-md">
  //               <div>
  //                 <ServerStackIcon className="shrink-0 h-6 w-6" />
  //                 <span>
  //                   {"Error! It seems we can't reach Dorixs' servers. Please try again later..."}
  //                 </span>
  //               </div>
  //             </div>
  //           </IntegrationMenu>
  // E.fold(
  //   (e) =>
  //     match(e)
  //       .with({ _tag: "ManagementError" }, () => (
  //       ))
  //       // .with({ tag: "ManagementMismatchError" }, (e) => (
  //       //   <div className="flex flex-col min-h-0 grow items-center justify-center">
  //       //     <div className="alert alert-warning shadow-lg max-w-md">
  //       //       <div>
  //       //         <ExclamationTriangleIcon className="shrink-0 h-6 w-6" />
  //       //         <span>
  //       //           Warning! Management Integration is mismatched. Expected {e.needed} configuration
  //       //           but received
  //       //           {e.given} configuration
  //       //         </span>
  //       //       </div>
  //       //     </div>
  //       //   </div>
  //       // ))
  //       .otherwise(() => (
  //         <div className="flex flex-col min-h-0 grow items-center justify-center">
  //           <div className="alert alert-error shadow-lg max-w-md">
  //             <div>
  //               <XCircleIcon className="shrink-0 h-6 w-6" />
  //               <span>
  //                 Error! Something went wrong along the way, please reach out to a Renu admin to
  //                 resolve this issue
  //               </span>
  //             </div>
  //           </div>
  //         </div>
  //       )),
  //   (props) => <IntegrationMenu {...props} />
  //   )
  // )
}

type Props = {
  integration: ManagementIntegration;
  menu: Management.Menu;
};

const useItemSuggestions = (categories: ReadonlyArray<Management.Category>) =>
  useCallback(
    (query: string) =>
      pipe(
        matchSorter(categories, query, { keys: ["name", "items.*.name"] }),
        A.filterMap((category) =>
          A.isNonEmptyReadonlyArray(category.items)
            ? O.some(
              <AutocompleteCategory
                key={category.id + category.name}
                title={category.name}
              >
                {pipe(
                  matchSorter(category.items, query, { keys: ["name"] }),
                  A.filterMap((it) =>
                    it.id != null
                      ? O.some(
                        <AutocompleteOption
                          key={category.name + it.id + it.name}
                          value={it}
                          displayValue={(i) => i.name}
                        />,
                      )
                      : O.none<JSX.Element>()
                  ),
                )}
              </AutocompleteCategory>,
            )
            : O.none()
        ),
      ),
    [categories],
  );

const useModifierSuggestions = (
  modifiers: ReadonlyArray<Management.Modifier>,
) =>
  useCallback(
    (query: string) =>
      pipe(
        matchSorter(modifiers, query, { keys: ["name", "items.*.name"] }),
        A.filterMap((modifier) =>
          A.isNonEmptyReadonlyArray(modifier.options)
            ? O.some(
              <AutocompleteCategory
                key={modifier.id + modifier.name}
                title={modifier.name}
              >
                {pipe(
                  matchSorter(modifier.options, query, { keys: ["name"] }),
                  A.filterMap((it) =>
                    it.id != null
                      ? O.some(
                        <AutocompleteOption
                          key={modifier.name + it.id + it.name}
                          value={it}
                          displayValue={(it) => it.name}
                        />,
                      )
                      : O.none<JSX.Element>()
                  ),
                )}
              </AutocompleteCategory>,
            )
            : O.none()
        ),
      ),
    [modifiers],
  );

type Action =
  | { action: "SET_ITEM"; item: Management.Item | null }
  | {
    action: "SET_OPTION";
    pos: [number, number];
    option: Management.ModifierOption | null;
  }
  | { action: "COMMIT_CHANGES" }
  | { action: "INIT"; state: State };

type State = {
  readonly item: O.Option<Management.Item>;
  readonly modifiers: O.Option<ReadonlyArray<Management.Modifier>>;
  readonly options: ReadonlyArray<
    ReadonlyArray<Management.ModifierOption | null>
  >;
  readonly _initial: Pick<State, "item" | "options">;
  readonly dirty: boolean;
};

const state_ = Optic.id<State>();

const item_ = state_.at("item");

const modifiers_ = state_.at("modifiers");

const optionsIn = ([i1, i2]: [number, number]) =>
  state_.at("options").index(i1).index(i2);

const updateDirty = (state: State) =>
  Optic.modify(
    state_.at("dirty"),
  )(() => !eqDirty(state._initial, state))(state);

const resetInitial = Optic.modify(state_)((state) => ({
  ...state,
  _initial: { item: state.item, options: state.options },
}));

const reducer: Reducer<State, Action> = (state, action) =>
  pipe(
    state,
    match(action)
      .with({ action: "SET_ITEM" }, ({ item }) =>
        flow(
          Optic.replace(item_)(O.fromNullable(item)),
          Optic.replace(modifiers_)(O.fromNullable(item?.modifiers)),
        ))
      .with(
        { action: "SET_OPTION" },
        ({ option, pos: [modifierIndex, optionIndex] }) =>
          flow(Optic.replace(optionsIn([modifierIndex, optionIndex]))(option)),
      )
      .with({ action: "COMMIT_CHANGES" }, () => resetInitial)
      .with({ action: "INIT" }, ({ state }) => Optic.replace(state_)(state))
      .exhaustive(),
    updateDirty,
  );

const createState: (
  getValues: UseFormGetValues<ItemSchema>,
) => (menu: Management.Menu) => State = (getValues) => (menu) => {
  const [managementId, formModifiers] = getValues([
    "managementId",
    "modifiers",
  ]);
  const item = O.flatMap(O.fromNullable(managementId), (mid) =>
    pipe(
      menu.categories,
      A.flatMap((c) => c.items),
      A.findFirst((i) =>
        pipe(
          O.filter(i.id, (id) => id === mid),
          O.isSome,
        )
      ),
    ));

  const modifiers = pipe(
    item,
    O.map((i) => i.modifiers),
  );

  const options = A.map(
    formModifiers,
    (m) =>
      A.filterMap(m.config.options, (o) =>
        pipe(
          modifiers,
          O.map(A.flatMap((m) => m.options)),
          O.map(A.findFirst((mod) =>
            pipe(
              O.filter(mod.id, (id) => id === o.managementId),
              O.isSome,
            )
          )),
          O.map(O.getOrNull),
        )),
  );

  return {
    item,
    modifiers,
    options,
    _initial: { item, options },
    dirty: false,
  };
};

type DeepReadonlyArrayImpl<A> = A extends Array<infer U> ? ReadonlyArray<U>
  : A extends object ? { [K in keyof A]: DeepReadonlyArrayImpl<A[K]> }
  : A;
type DeepReadonlyArray<A> = ReadonlyArray<
  A extends object ? { [K in keyof A]: DeepReadonlyArrayImpl<A[K]> } : A
>;

const managementIdIn = ([i1, i2]: [number, number]) =>
  Optic.id<DeepReadonlyArray<ModifierSchema>>()
    .index(i1)
    .at("config")
    .at("options")
    .index(i2)
    .at("managementId");

const eqDirty = Equivalence.struct({
  item: O.getEquivalence(eqIdentified<Management.Item>()),
  options: A.getEquivalence(A.getEquivalence(eqManagementModifierOption)),
});

function IntegrationMenu(props: Props) {
  const { menu /* integration */ } = props;
  const { watch, control, register, setValue, getValues } = useFormContext<
    ItemSchema
  >();
  const { replace, fields } = useFieldArray({ control, name: "modifiers" });
  const [state, dispatch] = useReducer(reducer, menu, createState(getValues));

  const { modifiers, item, dirty } = state;

  const locale = useLocale();
  const createSuggestions = useItemSuggestions(menu.categories);
  const createModifierSuggestions = useModifierSuggestions(
    O.getOrElse(modifiers, A.empty),
  );

  useEffect(
    () =>
      watch((_, info) => {
        if (!info.name) {
          dispatch({ action: "INIT", state: createState(getValues)(menu) });
        }
      }).unsubscribe,
    [getValues, menu, watch],
  );

  const handleCommit = () => {
    setValue("managementId", O.getOrNull(O.flatMap(item, (it) => it.id)));
    const newFields = pipe(
      A.map(fields, ({ id, ...f }) => f),
      A.flatMap((f, i1) =>
        A.map(f.config.options, (_, i2) =>
          pipe(
            Optic.getOption(optionsIn([i1, i2]))(state),
            O.flatMapNullable((o) => o?.id),
            O.flatten,
            O.getOrNull,
            Optic.replace(managementIdIn([i1, i2])),
          ))
      ),
      A.reduce(fields as DeepReadonlyArray<ModifierSchema>, (fs, f) => f(fs)),
    );
    replace(newFields as ModifierSchema[]);
    dispatch({ action: "COMMIT_CHANGES" });
  };

  return (
    <div className="p-4 space-y-4 grow flex flex-col min-h-0 overflow-auto">
      <div className="grid grid-cols-3 items-start">
        <h3 className="text-lg font-medium leading-6 pt-2">
          {watch(`${locale}.name`)}
        </h3>
        <div className="col-span-2">
          <div className="max-w-xs">
            <input {...register("managementId")} className="hidden" />
            <NullableAutocomplete
              value={O.getOrNull(item)}
              onChange={(item) => dispatch({ action: "SET_ITEM", item })}
              by={eqManagementItem}
              createSuggestions={createSuggestions}
              displayValue={flow(
                O.fromNullable,
                O.map((i) => i.name),
                O.getOrElse(() => ""),
              )}
            />
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="space-y-8 divide-y">
        {pipe(
          watch("modifiers"),
          A.map((m, modifierIndex) => (
            <div key={m.config.identifier}>
              <h3>{m.config.content[locale].name}</h3>
              <div className="space-y-8">
                {pipe(
                  m.config.options as OptionsSchemaArray,
                  A.map((op, optionIndex) => (
                    <div key={op.identifier} className="grid grid-cols-3">
                      <input
                        {...register(
                          `modifiers.${modifierIndex}.config.options.${optionIndex}.managementId`,
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
                              })}
                            disabled={O.isNone(modifiers)}
                            value={pipe(
                              state,
                              Optic.getOption(
                                optionsIn([modifierIndex, optionIndex]),
                              ),
                              O.getOrNull,
                            )}
                            displayValue={flow(
                              O.fromNullable,
                              O.map((i) =>
                                i.name
                              ),
                              O.getOrElse(() => ""),
                            )}
                            createSuggestions={createModifierSuggestions}
                          />
                        </div>
                      </div>
                    </div>
                  )),
                )}
              </div>
            </div>
          )),
        )}
      </div>
      <div className="divider" />
      <div>
        <button
          type="button"
          disabled={!dirty}
          onClick={handleCommit}
          className="btn btn-primary"
        >
          update Integration
        </button>
      </div>
    </div>
  );
}
