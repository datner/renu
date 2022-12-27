import { Modifier } from "db/itemModifierConfig"
import { pipe } from "fp-ts/function"
import { match } from "ts-pattern"
import { map } from "fp-ts/Array"
import { OneOfComponent } from "src/menu/modifier-blocks/OneOf"
import { ExtrasComponent } from "../modifier-blocks/Extras"

type Props = {
  modifiers: Modifier[]
}

export function ModifiersBlock(props: Props) {
  const { modifiers } = props

  return (
    <div className="space-y-6">
      {pipe(
        modifiers,
        map((m) => m.config),
        map((c) =>
          match(c)
            .with({ _tag: "oneOf" }, (of) => <OneOfComponent key={of.identifier} modifier={of} />)
            .with({ _tag: "extras" }, (ex) => <ExtrasComponent key={ex.identifier} modifier={ex} />)
            .exhaustive()
        )
      )}
    </div>
  )
}
