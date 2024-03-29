import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Schema from "@effect/schema/Schema";
import { PlusIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { ActionIcon, Button, NumberInput, Switch, TextInput } from "@mantine/core";
import { useEffect } from "react";
import { Control, Controller, useFieldArray, UseFieldArrayUpdate, useForm } from "react-hook-form";
import { schemaResolver } from "shared/effect/Schema";
import { ExtrasSchema, ItemFormSchema } from "../validations/item-form";

type Props = {
  control: Control<ItemFormSchema>;
  update: UseFieldArrayUpdate<ItemFormSchema, "modifiers">;
  onDuplicate(): void;
  field: { readonly config: ExtrasSchema };
  index: number;
};

export const ExtrasForm = (props: Props) => {
  const { index, update, field, onDuplicate } = props;
  const { register, reset, control, handleSubmit, formState } = useForm({
    resolver: schemaResolver(Schema.from(ExtrasSchema)),
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

  return (
    <div className="grow overflow-auto min-h-0 p-4 bg-gray-50">
      <div className="flex gap-4">
        <TextInput {...register(`identifier`)} label="Modifier Ref" />
        <div className="flex grow justify-end">
          <Button type="button" onClick={onDuplicate} className="justify-self-end">
            Duplicate
          </Button>
        </div>
      </div>
      <div className="flex gap-4 [&>*]:flex-1 mt-2">
        <TextInput {...register(`content.en.name`)} label="English Name" />
        <TextInput {...register(`content.he.name`)} label="Hebrew Name" />
      </div>
      <div className="flex gap-4 [&>*]:flex-1 mt-2">
        <Controller
          control={control}
          name="min"
          render={({ field }) => (
            <NumberInput
              {...field}
              onChange={_ => field.onChange(_ || 0)}
              min={0}
              label="Minimum Selection"
            />
          )}
        />
        <Controller
          control={control}
          name="max"
          render={({ field }) => (
            <NumberInput
              {...field}
              onChange={_ => field.onChange(_ || 0)}
              min={0}
              label="Maximum Selection"
            />
          )}
        />
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
                className="absolute right-1 top-1,"
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
              <div className="mt-2">
                <Controller
                  control={control}
                  name={`options.${i}.multi`}
                  render={({ field: { value, ...field } }) => (
                    <Switch {...field} checked={value} label="Supports Multiple" />
                  )}
                />
              </div>
            </div>
          )),
        )}
      </div>
      <Button
        mt={16}
        onClick={() =>
          append({
            identifier: "",
            content: {
              en: { name: "", description: "" },
              he: { name: "", description: "" },
            },
            price: 0,
            multi: false,
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
