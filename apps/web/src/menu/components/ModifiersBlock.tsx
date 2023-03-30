import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Order from "@effect/data/typeclass/Order";
import { useMemo } from "react";
import { ExtrasComponent } from "src/menu/modifier-blocks/Extras";
import { OneOfComponent } from "src/menu/modifier-blocks/OneOf";
import * as _Menu from "src/menu/schema";

interface Props {
  readonly modifiers: ReadonlyArray<_Menu.ItemModifier>;
}

const ModifierOrder = Order.contramap(Order.number, (m: _Menu.ItemModifier) => m.position);

export function ModifiersBlock(props: Props) {
  const { modifiers } = props;
  const sorted = useMemo(() => A.sort(modifiers, ModifierOrder), [modifiers]);

  return (
    <div className="space-y-6">
      {pipe(
        sorted,
        A.map((c) => {
          if (_Menu.isItemOneOf(c)) {
            return <OneOfComponent key={c.id} modifier={c} />;
          }

          if (_Menu.isItemExtras(c)) {
            return <ExtrasComponent key={c.id} modifier={c} />;
          }
        }),
      )}
    </div>
  );
}
