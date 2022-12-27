import {
  ExtrasSchemaInput,
  ItemSchema,
  ModifierSchema,
  OneOfSchemaInput,
} from "src/items/validations"
import * as L from "monocle-ts/Lens"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import * as T from "fp-ts/Task"
import * as TO from "fp-ts/TaskOption"
import * as NA from "fp-ts/NonEmptyArray"
import { pipe } from "fp-ts/function"
import { match } from "ts-pattern"
import { useFieldArray, useFormContext } from "react-hook-form"
import { ModifiersSortableList } from "./ModifiersSortableList"
import { useStableO } from "fp-ts-react-stable-hooks"
import { ModifierField } from "src/items/helpers/form"
import { useModal } from "@ebay/nice-modal-react"
import { NewModifierModal } from "./NewModiferModal"
import { ModifierEnum } from "db/itemModifierConfig"
import { OneOfForm } from "../modifier-forms/OneOfForm"
import { ExtrasForm } from "../modifier-forms/ExtrasForm"

const getInitialModifierValues = (mod: {
  _tag: ModifierEnum
}): OneOfSchemaInput | ExtrasSchemaInput => {
  switch (mod._tag) {
    case ModifierEnum.enum.oneOf:
      return {
        _tag: "oneOf",
        identifier: "",
        defaultOption: "",
        content: {
          en: { description: "", name: "" },
          he: { name: "", description: "" },
        },
        // @ts-expect-error
        options: NA.of({
          managementId: null,
          content: {
            en: { description: "", name: "" },
            he: { name: "", description: "" },
          },
          identifier: "",
          price: 0,
        }),
      }
    case ModifierEnum.enum.extras:
      return {
        _tag: "extras",
        identifier: "",
        content: {
          en: { description: "", name: "" },
          he: { name: "", description: "" },
        },
        // @ts-expect-error
        options: NA.of({
          managementId: null,
          content: {
            en: { locale: "en", description: "", name: "" },
            he: { locale: "he", name: "", description: "" },
          },
          identifier: "",
          multi: false,
          price: 0,
        }),
        min: 0,
        max: 0,
      }
  }
}

const addCopy = pipe(
  L.id<ModifierSchema>(),
  L.prop("config"),
  L.prop("identifier"),
  L.modify((id) => `${id}-copy`)
)

export function ModifierPanel() {
  const modal = useModal(NewModifierModal)
  const { control, getValues } = useFormContext<ItemSchema>()
  const { fields, move, append, update } = useFieldArray({ control, name: "modifiers" })
  const [fieldIndex, setFieldIndex] = useStableO<number>(O.none)

  const updateConfig: typeof update = (i, m) => {
    update(i, Object.assign(getValues(`modifiers.${i}`), m))
  }

  const handleAddModifier = pipe(
    (() => modal.show()) as T.Task<{ _tag: ModifierEnum } | undefined>,
    T.map(O.fromNullable),
    TO.map(getInitialModifierValues),
    TO.bindTo("config"),
    TO.map(append)
  )

  return (
    <div className="flex grow min-h-0 divide-x rtl:divide-x-reverse gap-1">
      <div className="flex flex-col overflow-auto min-h-0 rtl:pl-4 ltr:pr-4 py-4">
        <ModifiersSortableList
          fields={fields}
          move={move}
          onClick={(field) => setFieldIndex(O.some(field))}
          onAddModifier={handleAddModifier}
        />
      </div>
      {pipe(
        fieldIndex,
        O.bindTo("index"),
        O.bind("field", ({ index }) => A.lookup(index)(fields)),
        O.let("update", () => updateConfig),
        O.let("control", () => control),
        O.let(
          "onDuplicate",
          ({ field: { id, ...rest } }) =>
            () =>
              pipe(rest, addCopy, append)
        ),
        O.match(
          () => <PickAction />,
          (props) =>
            match(props)
              .with({ field: { config: { _tag: "oneOf" } } }, (props) => <OneOfForm {...props} />)
              .with({ field: { config: { _tag: "extras" } } }, (props) => <ExtrasForm {...props} />)
              .otherwise((props) => <EditOrCreate {...props} />)
        )
      )}
    </div>
  )
}

function PickAction() {
  return <div className="grow">pick or create a modifier</div>
}

function EditOrCreate(props: { field: ModifierField }) {
  const { field } = props
  return <pre className="flex grow overflow-auto min-h-0">{JSON.stringify(field, null, 2)}</pre>
}
