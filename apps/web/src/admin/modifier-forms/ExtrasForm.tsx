import { NumberInput, TextInput, Button, ActionIcon, Switch } from "@mantine/core"
import { shekelFormatter, shekelParser } from "src/core/helpers/form"
import { useZodForm } from "src/core/hooks/useZodForm"
import { ExtrasSchema, ItemSchema } from "src/items/validations"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/function"
import { useEffect } from "react"
import { Control, Controller, useFieldArray, UseFieldArrayUpdate } from "react-hook-form"
import { PlusIcon } from "@heroicons/react/20/solid"
import { XMarkIcon } from "@heroicons/react/24/solid"

type Props = {
  control: Control<ItemSchema>
  update: UseFieldArrayUpdate<ItemSchema, "modifiers">
  onDuplicate(): void
  field: { config: ExtrasSchema }
  index: number
}

export const ExtrasForm = (props: Props) => {
  const { index, update, field, onDuplicate } = props
  const { register, reset, control, handleSubmit, formState } = useZodForm({
    schema: ExtrasSchema,
    defaultValues: field.config,
  })

  useEffect(() => {
    reset(field.config)
  }, [reset, field.config])

  const { fields, append, remove } = useFieldArray({ control, name: "options" })

  const handleUpdate = handleSubmit(
    (data) => {
      return update(index, { config: data })
    },
    (err) => console.log(err)
  )

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
          render={({ field }) => <NumberInput {...field} min={0} label="Minimum Selection" />}
        />
        <Controller
          control={control}
          name="max"
          render={({ field }) => <NumberInput {...field} min={0} label="Maximum Selection" />}
        />
      </div>
      <div className="space-y-2 mt-4">
        {pipe(
          fields,
          A.mapWithIndex((i, f) => (
            <div
              key={f.id}
              className="relative border border-gray-300 bg-white p-4 shadow-md rounded-md"
            >
              <ActionIcon
                sx={{ position: "absolute", right: 4, top: 4 }}
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
                      {...field}
                      label="Price"
                      parser={shekelParser}
                      formatter={shekelFormatter}
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
          ))
        )}
      </div>
      <Button
        mt={16}
        onClick={() =>
          append({
            managementId: null,
            identifier: "",
            content: {
              en: { name: "", description: "" },
              he: { name: "", description: "" },
            },
            price: 0,
            multi: false,
          })
        }
        type="button"
        variant="outline"
        leftIcon={<PlusIcon className="h-5 w-5" />}
      >
        Add Option
      </Button>
      <Button mt={16} onClick={handleUpdate} type="button" fullWidth disabled={!formState.isDirty}>
        Update Modifier
      </Button>
    </div>
  )
}
