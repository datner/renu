import { constFalse, pipe } from "@effect/data/Function";
import * as N from "@effect/data/Number";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import { Transition } from "@headlessui/react";
import { useTimeout } from "@mantine/hooks";
import { constTrue } from "fp-ts/lib/function";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { ModifierConfig, Venue } from "shared";
import { toShekel } from "src/core/helpers/content";
import { AmountCounter } from "../components/AmountCounter";
import { useTitle } from "../hooks/useTitle";
import { ItemForm } from "../validations/item";

type Props = {
  modifier: Venue.Menu.MenuModifierItem & { config: ModifierConfig.Extras.Extras };
};

const ExtrasCheck = ({
  option,
  name,
  maxReached,
}: {
  option: ModifierConfig.Extras.Option;
  name: string;
  maxReached: boolean;
}) => {
  const title = useTitle();
  const { field } = useController({ name, defaultValue: 0 });
  const handleChange = () => {
    changeValue(field.value > 0 ? 0 : 1);
  };
  const handleClick = () => {
    const surplus = maxReached ? 0 : 1;
    const value = option.multi ? field.value + surplus : field.value > 0 ? 0 : surplus;

    changeValue(value);
  };
  const [show, setShow] = useState(field.value > 0 && option.multi);
  const { start, clear } = useTimeout(() => setShow(false), 1600, { autoInvoke: true });
  const changeValue = (value: number) => {
    if (value !== field.value) {
      // prevents needless rerender
      field.onChange(value);
    }
    clear();
    if (value > 0 && option.multi) {
      setShow(true);
      return start();
    }
    setShow(false);
  };

  return (
    <div key={option.identifier} className="label relative gap-1 justify-start">
      <input id={"input-" + field.name} type="number" className="hidden" {...field} />
      <input
        id={`checkbox-${option.identifier}`}
        disabled={field.value === 0 && maxReached}
        checked={field.value > 0}
        type="checkbox"
        className="checkbox checkbox-primary z-20 rtl:-scale-x-100"
        onChange={handleChange}
      />
      <div className="absolute inset-0 z-10" onClick={handleClick} />
      <label htmlFor={"input-" + field.name} className="label-text grow">
        <AmountCounter label={title(option.content)} amount={field.value} />
      </label>
      {option.price > 0 && <span className="label-text">{toShekel(option.price * Math.max(1, field.value))}</span>}
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
  );
};

const getAmount = (choices?: Record<string, number>) =>
  pipe(
    O.fromNullable(choices),
    O.map(RR.collect((_, a) => a)),
    O.map(N.sumAll),
    O.getOrElse(() => 0),
  );

export const ExtrasComponent = (props: Props) => {
  const { modifier } = props;
  const { id } = modifier;
  // TODO: actually make this strict
  const config = modifier.config as ModifierConfig.Extras.Extras;
  const title = useTitle();
  const t = useTranslations("menu.Components.Extras");
  const { control } = useFormContext<ItemForm>();

  const { field, fieldState } = useController({
    control,
    name: `modifiers.extras.${id}.choices`,
    rules: {
      validate: {
        overMax: (o) => O.match(config.max, { onNone: constTrue, onSome: N.greaterThanOrEqualTo(getAmount(o)) }),
        belowMin: (o) =>
          N.lessThanOrEqualTo(
            O.getOrElse(config.min, () => 0),
            getAmount(o),
          ),
      },
    },
  });

  const value = useWatch({ control, name: `modifiers.extras.${id}.choices` });

  const maxReached = O.match(config.max, {
    onNone: constFalse,
    onSome: (max) => N.lessThanOrEqualTo(max, getAmount(value)),
  });

  const minText = O.map(config.min, (min) => t("min", { min }));

  const maxText = O.map(config.max, (max) => t("max", { max }));

  const minMaxText = pipe(
    A.compact([minText, maxText]),
    A.join(" "),
  );

  return (
    <fieldset ref={field.ref} tabIndex={0} className="form-control">
      <legend className="label w-full">
        <p className="label-text">
          {title(config.content)}
          <br />
          {minMaxText}
          <br />
          {fieldState.invalid && <span className="text-error">{t("error")}</span>}
        </p>
      </legend>
      {config.options.map((o) => (
        <ExtrasCheck
          maxReached={maxReached}
          key={o.identifier}
          option={o}
          name={`modifiers.extras.${id}.choices.${o.identifier}`}
        />
      ))}
    </fieldset>
  );
};
ExtrasComponent.displayName = "Extras";
