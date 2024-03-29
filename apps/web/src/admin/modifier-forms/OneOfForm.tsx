import * as Schema from "@effect/schema/Schema";
import { PlusIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { ActionIcon, Button, NumberInput, Select, TextInput } from "@mantine/core";
import { pipe, ReadonlyArray as A } from "effect";
import { useEffect } from "react";
import { Control, Controller, useFieldArray, UseFieldArrayUpdate, useForm } from "react-hook-form";
import { schemaResolver } from "shared/effect/Schema";
import { ItemFormSchema, OneOfSchema } from "../validations/item-form";

type Props = {
  control: Control<ItemFormSchema>;
  update: UseFieldArrayUpdate<ItemFormSchema, "modifiers">;
  onDuplicate(): void;
  onDelete(): void;
  field: { readonly config: OneOfSchema };
  index: number;
};

export const OneOfForm = (props: Props) => {
  const { index, update, field, onDuplicate, onDelete } = props;
  const { register, reset, control, watch, handleSubmit, formState } = useForm({
    resolver: schemaResolver(Schema.from(OneOfSchema)),
    defaultValues: field.config,
  });
  useEffect(() => {
    reset(field.config);
  }, [reset, field.config]);

  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  const handleUpdate = handleSubmit(
    (data) => {
      return update(index, { config: data });
    },
    (err) => console.log(err),
  );

  const controlledFields = A.zipWith(fields, watch("options"), (f, o) => Object.assign(f, o));
  return (
    <div className="grow overflow-auto min-h-0 p-4 bg-gray-50">
      <div className="flex gap-4">
        <TextInput {...register(`identifier`)} label="Modifier Ref" />
        {controlledFields.some((f) => f.identifier !== "") && (
          <Controller
            control={control}
            name="defaultOption"
            render={({ field }) => (
              <Select
                {...field}
                onChange={_ => field.onChange(_ ?? "")}
                label="Default Selection"
                placeholder="Pick one"
                nothingFoundMessage="No options"
                searchable
                data={pipe(
                  controlledFields,
                  A.map((f, i) => ({ label: f.identifier, value: String(i) })),
                )}
              />
            )}
          />
        )}
        <div className="flex grow justify-end">
          <div className="flex flex-col gap-1">
            <Button type="button" color="red" onClick={onDelete} className="justify-self-end">
              Delete
            </Button>
            <Button type="button" onClick={onDuplicate} className="justify-self-end">
              Duplicate
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-4 [&>*]:flex-1 mt-2">
        <TextInput {...register(`content.en.name`)} label="English Name" />
        <TextInput {...register(`content.he.name`)} label="Hebrew Name" />
      </div>
      <div className="space-y-2 mt-4">
        {pipe(
          fields,
          A.map((f, i) => (
            <div
              key={f.id}
              className="relative border border-gray-300 bg-white p-4 shadow-md rounded-md"
            >
              <ActionIcon
                className="absolute right-1 top-1"
                type="button"
                color="red"
                variant="outline"
                onClick={() => remove(i)}
              >
                <XMarkIcon className="h-6 w-6" />
              </ActionIcon>
              <div className="flex gap-4 [&>*]:flex-1">
                <TextInput {...register(`options.${i}.identifier`)} label="Option Ref" />
                <Controller
                  control={control}
                  name={`options.${i}.price`}
                  render={({ field }) => (
                    <NumberInput
                      onChange={_ => field.onChange(+_ * 100 || 0)}
                      label="Price"
                      step={0.5}
                      allowNegative={false}
                      prefix="₪"
                      decimalScale={2}
                      fixedDecimalScale
                      thousandSeparator
                    />
                  )}
                />
              </div>
              <div className="flex gap-4 [&>*]:flex-1 mt-2">
                <TextInput {...register(`options.${i}.content.en.name`)} label="English Name" />
                <TextInput {...register(`options.${i}.content.he.name`)} label="Hebrew Name" />
              </div>
            </div>
          )),
        )}
      </div>
      <Button
        className="mt-4"
        onClick={() =>
          append({
            identifier: "",
            content: {
              en: { name: "", description: "" },
              he: { name: "", description: "" },
            },
            price: 0,
            managementRepresentation: null,
          })}
        type="button"
        variant="outline"
        leftSection={<PlusIcon className="h-5 w-5" />}
      >
        Add Option
      </Button>
      <Button mt={16} onClick={handleUpdate} type="button" fullWidth disabled={!formState.isDirty}>
        Update Modifier
      </Button>
    </div>
  );
};
