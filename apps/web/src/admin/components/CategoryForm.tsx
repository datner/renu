import { PromiseReturnType } from "blitz"
import { useZodForm } from "src/core/hooks/useZodForm"
import { useTranslations } from "next-intl"
import { DefaultValues, FormProvider } from "react-hook-form"
import { match, P } from "ts-pattern"
import { CategorySchema } from "src/categories/validations"
import getCategory from "src/categories/queries/getCategory"
import { Button, createStyles, TextInput } from "@mantine/core"

type Props = {
  item?: PromiseReturnType<typeof getCategory>
  onSubmit(category: CategorySchema): Promise<void>
  defaultValues?: DefaultValues<CategorySchema>
}

const DEFAULT_VALUES: DefaultValues<CategorySchema> = {
  identifier: "",
  en: { name: "" },
  he: { name: "" },
}

const useStyles = createStyles({
  mono: {
    fontFamily: [
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "Monaco",
      "Consolas",
      "Liberation Mono",
      "Courier New",
      "monospace",
    ],
  },
})

export function CategoryForm(props: Props) {
  const { defaultValues = DEFAULT_VALUES, onSubmit: onSubmit_ } = props
  const { classes } = useStyles()
  const t = useTranslations("admin.Components.CategoryForm")
  const form = useZodForm({
    schema: CategorySchema,
    defaultValues,
  })

  const { handleSubmit, setFormError, formState, register } = form
  const { isSubmitting } = formState

  const onSubmit = handleSubmit(async (data) => {
    try {
      console.time("submitting")
      await onSubmit_(data)
      console.timeEnd("submitting")
    } catch (error: any) {
      setFormError(error.toString())
    }
  })

  const result = {
    defaultValues: props.defaultValues?.identifier,
    isSubmitting,
  }

  const message = match(result)
    .with({ defaultValues: P.nullish, isSubmitting: true }, () => t("create.category"))
    .with({ defaultValues: P._, isSubmitting: true }, () => t("update.category"))
    .with({ defaultValues: P.nullish }, () => t("create.initial"))
    .with({ defaultValues: P._ }, () => t("update.initial"))
    .exhaustive()

  return (
    <FormProvider {...form}>
      <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4 h-16 flex">
          <h2 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-emerald-600 grow">
            {props.defaultValues ? t("title.edit") : t("title.new")}
          </h2>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1 font-mono" disabled={isSubmitting}>
              <TextInput
                classNames={{ input: classes.mono }}
                {...register("identifier")}
                label={t("identifier")}
                placeholder="my-category"
              />
              <TextInput
                {...register("en.name")}
                label={t("english name")}
                placeholder="My Category"
              />
              <TextInput
                {...register("he.name")}
                label={t("hebrew name")}
                placeholder="הקטגוריה שלי"
              />
            </fieldset>
          </div>
          <Button type="submit" loading={isSubmitting}>
            {message}
          </Button>
        </form>
      </div>
    </FormProvider>
  )
}
