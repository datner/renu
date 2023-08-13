import { pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as N from "@effect/data/Number";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  DefaultValues,
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { Item, ModifierConfig, Venue } from "shared";
import { LabeledTextArea } from "src/core/components/LabeledTextArea";
import { toShekel } from "src/core/helpers/content";
import * as Order from "src/menu/hooks/useOrder";
import { ItemForm } from "../validations/item";
import { AmountButtons } from "./AmountButtons";
import { ModifiersBlock } from "./ModifiersBlock";

interface ItemModalFormProps {
  order: O.Option<Order.OrderItem>;
  item: Venue.Menu.MenuItem;
  // Note on containerEl: this is a filthy dirty hack because I can't find a fuck to do it right
  containerEl: HTMLElement | null;
  onSubmit(data: ItemForm): void;
}

const OrderState = {
  NEW: "NEW",
  UPDATE: "UPDATE",
  REMOVE: "REMOVE",
} as const;

type OrderState = (typeof OrderState)[keyof typeof OrderState];

type OneOfModifier<I extends { config: ModifierConfig.Schema }> = I & { config: ModifierConfig.OneOf.OneOf };
type ExtrasModifier<I extends { config: ModifierConfig.Schema }> = I & { config: ModifierConfig.Extras.Extras };
type SliderModifier<I extends { config: ModifierConfig.Schema }> = I & { config: ModifierConfig.Slider.Slider };

export const getModifiers = <I extends { config: ModifierConfig.Schema }>(modifiers: ReadonlyArray<I>) => {
  let oneOfs: OneOfModifier<I>[] = [],
    extras: ExtrasModifier<I>[] = [],
    sliders: SliderModifier<I>[] = [];
  for (const mod of modifiers) {
    switch (mod.config._tag) {
      case "oneOf": {
        oneOfs.push(mod as OneOfModifier<I>);
        continue;
      }
      case "extras": {
        extras.push(mod as ExtrasModifier<I>);
        continue;
      }

      case "Slider": {
        sliders.push(mod as SliderModifier<I>);
        continue;
      }
    }
  }

  return { oneOfs, extras, sliders };
};

const makeDefaults = (item: Venue.Menu.MenuItem): DefaultValues<ItemFieldValues["modifiers"]> => {
  const { extras, oneOfs } = getModifiers(item.modifiers);
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
            O.getOrElse(() => A.headNonEmpty(oneOf.config.options).identifier),
          ),
        },
      ]),
    ),
    extras: Object.fromEntries(
      A.map(extras, (ex) => [
        ex.id,
        {
          identifier: ex.config.identifier,
          choices: Object.fromEntries(A.map(ex.config.options, (o) => [o.identifier, 0])),
        },
      ]),
    ),
  };
};

const makeOrderDefaults = (order: Order.OrderItem): DefaultValues<ItemFieldValues["modifiers"]> => {
  const { extras: allExtras, oneOfs } = getModifiers(order.item.modifiers);
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
                (o) => o.identifier,
              )
            ),
            O.getOrElse(() => A.headNonEmpty(oneOf.config.options).identifier),
          ),
        },
      ]),
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
                  O.getOrElse(() => 0),
                )),
            ),
          ),
        },
      ]),
    ),
  };
};

export interface ItemFieldValues {
  comment: string;
  amount: number;
  modifiers: {
    oneOf: Record<
      Item.Modifier.Id,
      {
        amount: number;
        identifier: string;
        choice: string;
      }
    >;
    extras: Record<
      Item.Modifier.Id,
      {
        identifier: string;
        choices: Record<string, number>;
      }
    >;
  };
}

export function ItemModalForm(props: ItemModalFormProps) {
  const { order, item, onSubmit, containerEl } = props;
  const t = useTranslations("menu.Components.ItemModal");
  const isEdit = O.isSome(order);

  const defaultValues = useMemo<DefaultValues<ItemFieldValues>>(
    () =>
      O.match(order, {
        onNone: () => ({
          comment: "",
          amount: 1,
          modifiers: makeDefaults(item),
        }),
        onSome: (o) => ({
          comment: o.comment,
          amount: Order.getAmount(o),
          modifiers: makeOrderDefaults(o),
        }),
      }),
    [order, item],
  );

  const form = useForm<ItemFieldValues>({
    defaultValues,
    reValidateMode: "onChange",
  });

  const { handleSubmit, control, formState, trigger, clearErrors } = form;

  const { isDirty } = formState;

  useEffect(() => {
    if (isEdit) {
      trigger();
    }

    return () => {
      clearErrors();
    };
  }, [isEdit, trigger, clearErrors]);

  const { field } = useController({ control, name: "amount" });
  const amount = field.value;

  const submitOrRemove = handleSubmit(
    (data) => {
      onSubmit(
        O.isSome(order) && (amount === 0 || !isDirty)
          ? { amount: 0, comment: "", modifiers: { oneOf: {}, extras: {} } }
          : data,
      );
    },
    (e) => console.log(e),
  );

  const modifiers = useMemo(
    () =>
      pipe(
        item.modifiers,
        A.map((m) => [m.id, m] as const),
        HashMap.fromIterable,
      ),
    [item],
  );

  const handleRemove = () => {
    onSubmit(
      { amount: 0, comment: "", modifiers: { oneOf: {}, extras: {} } },
    );
  };

  return (
    <form id="item-form" onSubmit={submitOrRemove}>
      <FormProvider {...form}>
        <ModifiersBlock modifiers={item.modifiers} />
        <div className="mt-4">
          <LabeledTextArea registerOptions={{ maxLength: 250 }} label={t("comment")} name="comment" rows={4} />
        </div>
        {containerEl
          && createPortal(
            <div className="mt-6 z-20 sticky bottom-4 mx-4 flex gap-2">
              {item.price !== 0 && (
                <div className="basis-32">
                  <AmountButtons
                    // Number(true) === 1, Number(false) === 0
                    minimum={Number(O.isNone(order))}
                    amount={amount}
                    onIncrement={() => field.onChange(amount + 1)}
                    onDecrement={() => field.onChange(amount - 1)}
                  />
                </div>
              )}
              <SubmitButton
                isCreate={O.isNone(order)}
                onRemove={handleRemove}
                price={item.price}
                modifierMap={modifiers}
              />
            </div>,
            containerEl,
          )}
      </FormProvider>
    </form>
  );
}

interface SubmitButtonProps {
  readonly price: number;
  readonly isCreate?: boolean;
  readonly modifierMap: HashMap.HashMap<Item.Modifier.Id, Venue.Menu.MenuModifierItem>;
  readonly onRemove: () => void;
}

function SubmitButton(props: SubmitButtonProps) {
  const { price, isCreate, modifierMap, onRemove } = props;
  const t = useTranslations("menu.Components.CallToActionText");
  const { control } = useFormContext<ItemForm>();
  const { isDirty, errors, isValid } = useFormState({ control });

  const [amount, oneOfs, extrases] = useWatch({
    control,
    name: ["amount", "modifiers.oneOf", "modifiers.extras"],
  });
  const multi = amount > 1;
  const isUpdate = amount > 0 && isDirty;

  const orderState = isCreate ? OrderState.NEW : isUpdate ? OrderState.UPDATE : OrderState.REMOVE;

  const oneOf = RR.collect(oneOfs, (id, { choice, amount }) =>
    pipe(
      modifierMap,
      HashMap.get(Item.Modifier.Id(Number(id))),
      O.map((o) => o.config),
      O.filter(ModifierConfig.isOneOf),
      O.flatMap((m) => A.findFirst(m.options, (o) => o.identifier === choice)),
      O.map((o) => o.price * amount),
      O.getOrElse(() => 0),
    ));

  const extras = RR.collect(extrases, (id, { choices }) =>
    pipe(
      modifierMap,
      HashMap.get(Item.Modifier.Id(Number(id))),
      O.map((m) => m.config),
      O.filter(ModifierConfig.isExtras),
      O.map((ex) =>
        RR.collect(choices, (choice, amount) =>
          pipe(
            A.findFirst(ex.options, (o) => o.identifier === choice),
            O.map((o) => o.price * amount),
          ))
      ),
      O.map(O.sumCompact),
      O.getOrElse(() => 0),
    ));

  // upgrade to something like
  // sequenceT(O.Apply)([markupOneOf, markupExtras, markupNewOne])
  const total = N.sumAll([price, ...oneOf, ...extras]) * amount;
  const isEmptySelection = price === 0 && total === 0;

  switch (orderState) {
    case OrderState.NEW:
      return (
        <button
          disabled={RR.isEmptyRecord(errors) ? isEmptySelection : !isValid}
          form="item-form"
          type="submit"
          className="btn grow px-2 btn-primary"
        >
          <span className="inline-block text-left rtl:text-right grow xs:grow-0 xs:mx-1.5">
            {t("add")}
          </span>{" "}
          <span className="hidden xs:inline-block text-left rtl:text-right grow">
            {t("to order")}
          </span>
          <span className="tracking-wider font-light">{toShekel(total)}</span>
        </button>
      );

    case OrderState.UPDATE:
      if (!isEmptySelection) {
        return (
          <button
            disabled={!isValid || isEmptySelection}
            form="item-form"
            type="submit"
            className="btn grow px-2 btn-primary"
          >
            <span className="inline-block rtl:text-right flex-grow">{t("update")}</span>
            <span className="tracking-wider font-light">{toShekel(total)}</span>
          </button>
        );
      }

    case OrderState.REMOVE:
      return (
        <button form="item-form" type="button" onClick={onRemove} className="btn grow px-2 btn-error">
          <span className="inline-block text-center font-medium flex-grow">
            {t("remove._")} {multi && t("remove.all")}
          </span>
        </button>
      );
  }
}
