import { useFormContext } from "react-hook-form";
import { useLocale } from "src/core/hooks/useLocale";
import { ItemForm } from "../validations/item";
import { getLabel } from "./helpers";

import { Modifiers } from "database-helpers";
import { toShekel } from "src/core/helpers/content";
import * as _Menu from "src/menu/schema";

type Props = {
  modifier: _Menu.ItemModifier<Modifiers.OneOf>;
};

export const OneOfComponent = (props: Props) => {
  const { modifier } = props;
  const { id, config } = modifier;
  const { register } = useFormContext<ItemForm>();
  const locale = useLocale();
  return (
    <fieldset className="field-control">
      <legend className="label">
        <span className="label-text">{getLabel(config)(locale)}</span>
      </legend>
      {config.options.map((o) => (
        <label key={o.identifier} className="label cursor-pointer justify-start gap-2">
          <input
            {...register(`modifiers.oneOf.${id}.choice`)}
            type="radio"
            className="radio radio-primary grow-0"
            value={o.identifier}
          />
          <span className="label-text grow">{getLabel(o)(locale)}</span>
          {o.price > 0 && <span className="label-text">{toShekel(o.price)}</span>}
        </label>
      ))}
    </fieldset>
  );
};
OneOfComponent.displayName = "OneOf";
