import { useModal } from "@ebay/nice-modal-react";
import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import { Effect, Match, Option as O, ReadonlyArray as A } from "effect";
import * as L from "monocle-ts/Lens";
import { useState } from "react";
import { Control, FieldArrayWithId, useFieldArray, UseFieldArrayUpdate, useFormContext } from "react-hook-form";
import { ModifierField } from "src/items/helpers/form";
import { ExtrasForm } from "../modifier-forms/ExtrasForm";
import { OneOfForm } from "../modifier-forms/OneOfForm";
import { ItemFormSchema, ModifierConfigSchema, ModifierSchema } from "../validations/item-form";
import { ModifiersSortableList } from "./ModifiersSortableList";
import { NewModifierModal } from "./NewModiferModal";

const getInitialModifierValues = (mod: {
  _tag: "oneOf" | "extras";
}): Schema.Schema.From<typeof ModifierConfigSchema> => {
  switch (mod._tag) {
    case "oneOf":
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
          managementRepresentation: null,
        }),
      };
    case "extras":
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
          managementRepresentation: null,
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

interface SectionProps {
  control: Control<ItemFormSchema, any>;
  update: UseFieldArrayUpdate<ItemFormSchema, "modifiers">;
  field: FieldArrayWithId<ItemFormSchema, "modifiers", "id">;
  index: number;
  onDuplicate: () => void;
  onDelete: () => void;
}

// Don't copy me, this is not good React
const renderField = Match.type<SectionProps>().pipe(
  Match.when({ field: { config: { _tag: "oneOf" } } }, OneOfForm),
  Match.when({ field: { config: { _tag: "extras" } } }, ExtrasForm),
  Match.orElse(EditOrCreate),
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
    Effect.promise(() => modal.show() as Promise<{ _tag: "oneOf" | "extras" } | undefined>),
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
      {O.Do.pipe(
        O.bind("index", () => fieldIndex),
        O.bind("field", ({ index }) => A.get(index)(fields)),
        O.let("update", () => updateConfig),
        O.let("control", () => control),
        O.let(
          "onDuplicate",
          ({ field: { id, ...rest } }) => () => pipe(rest, addCopy, append),
        ),
        O.let("onDelete", ({ index }) => () => {
          console.log("deleting ", index);
          return remove(index);
        }),
        O.match({
          onNone: () => <PickAction />,
          onSome: renderField,
        }),
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
