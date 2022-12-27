import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { FieldValues, useForm, UseFormProps } from "react-hook-form"
import type * as z from "zod"
import { useEvent } from "./useEvent"

type UseZodFormProps<
  Zod extends z.ZodSchema,
  TContext = any,
  TFieldValues extends FieldValues = z.input<Zod>
> = Omit<UseFormProps<TFieldValues, TContext>, "resolver"> & { schema: Zod }

export const useZodForm = <Zod extends z.ZodSchema, TContext = any>({
  schema,
  ...props
}: UseZodFormProps<Zod, TContext>) => {
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm({
    ...props,
    resolver: zodResolver(schema),
  })
  const bind = useEvent<typeof form["register"]>((name, options) => {
    const { error } = form.getFieldState(name, form.formState)
    const errorId = `${name}-error`

    return { error, errorId, ...form.register(name, options) }
  })
  return Object.assign(form, { formError, setFormError, bind })
}
