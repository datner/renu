import { useFormContext } from "react-hook-form";
import { ModifierConfig, Venue } from "shared";
import { toShekel } from "src/core/helpers/content";
import { useTitle } from "../hooks/useTitle";
import { ItemForm } from "../validations/item";

type Props = {
  modifier: Venue.Menu.MenuModifierItem & { config: ModifierConfig.OneOf.OneOf };
};

export const OneOfComponent = (props: Props) => {
  const { modifier } = props;
  const { id, config } = modifier;
  const { register } = useFormContext<ItemForm>();
  const title = useTitle();
  return (
    <fieldset className="field-control">
      <legend className="label">
        <span className="label-text">{title(config.content)}</span>
      </legend>
      {config.options.map((o) => (
        <label key={o.identifier} className="label cursor-pointer justify-start gap-2">
          <input
            {...register(`modifiers.oneOf.${id}.choice`)}
            type="radio"
            className="radio radio-primary grow-0"
            value={o.identifier}
          />
          <span className="label-text grow">{title(o.content)}</span>
          {o.price > 0 && <span className="label-text">{toShekel(o.price)}</span>}
        </label>
      ))}
    </fieldset>
  );
};
OneOfComponent.displayName = "OneOf";
