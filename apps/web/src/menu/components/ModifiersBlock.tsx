import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Order from "@effect/data/Order";
import { useMemo } from "react";
import { Item, Venue } from "shared";
import { ExtrasComponent } from "src/menu/modifier-blocks/Extras";
import { OneOfComponent } from "src/menu/modifier-blocks/OneOf";

interface Props {
  readonly modifiers: ReadonlyArray<Venue.Menu.MenuModifierItem>;
}

const ModifierOrder = Order.contramap(Order.number, (m: Venue.Menu.MenuModifierItem) => m.position);

export function ModifiersBlock(props: Props) {
  const { modifiers } = props;
  const sorted = useMemo(() => A.sort(modifiers, ModifierOrder), [modifiers]);

  return (
    <div className="space-y-6">
      {pipe(
        sorted,
        A.map((c) => {
          if (Item.Modifier.isOneOf(c)) {
            return <OneOfComponent key={c.id} modifier={c} />;
          }

          if (Item.Modifier.isExtras(c)) {
            return <ExtrasComponent key={c.id} modifier={c} />;
          }
        }),
      )}
    </div>
  );
}
