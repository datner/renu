import { PromiseReturnType } from "blitz"
import LabeledTextField from "src/core/components/LabeledTextField"
import { useZodForm } from "src/core/hooks/useZodForm"
import { useTranslations } from "next-intl"
import { DefaultValues, FormProvider, SubmitHandler } from "react-hook-form"
import { useEffect } from "react"
import { CategorySchema } from "src/categories/validations"
import getCategory from "src/categories/queries/getCategory"

type Props = {
  item?: PromiseReturnType<typeof getCategory>
  onSubmit: SubmitHandler<CategorySchema>
  defaultValues?: DefaultValues<CategorySchema>
}

const DEFAULT_VALUES: DefaultValues<CategorySchema> = {
  identifier: "",
  en: { name: "" },
  he: { name: "" },
}

export function OrganizationForm(props: Props) {
  const { defaultValues = DEFAULT_VALUES, onSubmit: onSubmit_ } = props
  const t = useTranslations("admin.Components.CategoryForm")
  const form = useZodForm({
    schema: CategorySchema,
    defaultValues,
  })

  const { handleSubmit, setFormError, formState, reset } = form
  const { isSubmitting } = formState

  useEffect(() => {
    reset(defaultValues)
  }, [reset, defaultValues])

  const onSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit_(data)
    } catch (error: any) {
      setFormError(error.toString())
    }
  })

  const suffix = isSubmitting ? "ing" : "e"
  const verb = defaultValues.identifier ? "Updat" : "Creat"
  const message = `${verb}${suffix} Organization ${isSubmitting ? "..." : ""}`

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4 h-20 flex">
          <h2 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600 grow">
            {props.defaultValues ? t("title.edit") : t("title.new")}
          </h2>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1" disabled={isSubmitting}>
              <div className="flex gap-2 items-center">
                <div className="grow">
                  <LabeledTextField
                    name="identifier"
                    label={t("identifier")}
                    placeholder="my-category"
                  />
                </div>
              </div>
              <LabeledTextField
                name="en.name"
                label={t("english name")}
                placeholder="My Category"
              />
              <LabeledTextField
                name="he.name"
                label={t("hebrew name")}
                placeholder="הקטגוריה שלי"
              />
            </fieldset>
          </div>
          <button
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            type="submit"
            disabled={isSubmitting}
          >
            {message}
          </button>
        </form>
      </div>
    </FormProvider>
  )
}
