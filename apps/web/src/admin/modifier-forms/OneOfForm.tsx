import { NumberInput, TextInput, Select, Button, ActionIcon } from "@mantine/core"
import { shekelFormatter, shekelParser } from "src/core/helpers/form"
import { useZodForm } from "src/core/hooks/useZodForm"
import { ItemSchema, OneOfSchema } from "src/items/validations"
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
  field: { config: OneOfSchema }
  index: number
}

export const OneOfForm = (props: Props) => {
  const { index, update, field, onDuplicate } = props
  const { register, reset, control, watch, handleSubmit, formState } = useZodForm({
    schema: OneOfSchema,
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

  const controlledFields = A.zipWith(fields, watch("options"), (f, o) => Object.assign(f, o))
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
                label="Default Selection"
                placeholder="Pick one"
                nothingFound="No options"
                searchable
                data={pipe(
                  controlledFields,
                  A.mapWithIndex((i, f) => ({ label: f.identifier, value: String(i) }))
                )}
              />
            )}
          />
        )}
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
