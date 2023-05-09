import { useModal } from "@ebay/nice-modal-react";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import { ModifierEnum } from "db/itemModifierConfig";
import * as L from "monocle-ts/Lens";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ModifierField } from "src/items/helpers/form";
import { ExtrasSchemaInput, OneOfSchemaInput } from "src/items/validations";
import { match } from "ts-pattern";
import { ExtrasForm } from "../modifier-forms/ExtrasForm";
import { OneOfForm } from "../modifier-forms/OneOfForm";
import { ItemFormSchema, ModifierSchema } from "../validations/item-form";
import { ModifiersSortableList } from "./ModifiersSortableList";
import { NewModifierModal } from "./NewModiferModal";

const getInitialModifierValues = (mod: {
  _tag: ModifierEnum;
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
        options: A.of({
          managementId: null,
          content: {
            en: { description: "", name: "" },
            he: { name: "", description: "" },
          },
          identifier: "",
          price: 0,
        }),
      };
    case ModifierEnum.enum.extras:
      return {
        _tag: "extras",
        identifier: "",
        content: {
          en: { description: "", name: "" },
          he: { name: "", description: "" },
        },
        options: A.of({
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
      };
  }
};

const addCopy = pipe(
  L.id<ModifierSchema>(),
  L.prop("config"),
  L.prop("identifier"),
  L.modify((id) => `${id}-copy`),
);

export function ModifierPanel() {
  const modal = useModal(NewModifierModal);
  const { control, getValues } = useFormContext<ItemFormSchema>();
  const { fields, move, append, update, remove } = useFieldArray({ control, name: "modifiers" });
  const [fieldIndex, setFieldIndex] = useState<O.Option<number>>(O.none());

  const updateConfig: typeof update = (i, m) => {
    update(i, Object.assign(getValues(`modifiers.${i}`), m));
  };

  const handleAddModifier = pipe(
    Effect.promise(() => modal.show() as Promise<{ _tag: ModifierEnum } | undefined>),
    Effect.flatMap(O.fromNullable),
    Effect.map(getInitialModifierValues),
    Effect.bindTo("config"),
    Effect.map(append),
    Effect.asUnit,
  );

  return (
    <div className="flex grow min-h-0 divide-x rtl:divide-x-reverse gap-1">
      <div className="flex flex-col overflow-auto min-h-0 rtl:pl-4 ltr:pr-4 py-4">
        <ModifiersSortableList
          fields={fields}
          move={move}
          onClick={(field) => setFieldIndex(O.some(field))}
          onAddModifier={() => Effect.runPromise(handleAddModifier)}
        />
      </div>
      {pipe(
        O.Do(),
        O.bind("index", () => fieldIndex),
        O.bind("field", ({ index }) => A.get(index)(fields)),
        O.let("update", () => updateConfig),
        O.let("control", () => control),
        O.let(
          "onDuplicate",
          ({ field: { id, ...rest } }) => () => pipe(rest, addCopy, append),
        ),
        O.let("onDelete", ({ index }) => () => {
          console.log("deleting ",index)
          return remove(index);
        }),
        O.match(
          () => <PickAction />,
          (props) =>
            match(props)
              .with({ field: { config: { _tag: "oneOf" } } }, (props) => <OneOfForm {...props} />)
              .with({ field: { config: { _tag: "extras" } } }, (props) => <ExtrasForm {...props} />)
              .otherwise((props) => <EditOrCreate {...props} />),
        ),
      )}
    </div>
  );
}

function PickAction() {
  return <div className="grow">pick or create a modifier</div>;
}

function EditOrCreate(props: { field: ModifierField }) {
  const { field } = props;
  return <pre className="flex grow overflow-auto min-h-0">{JSON.stringify(field, null, 2)}</pre>;
}
