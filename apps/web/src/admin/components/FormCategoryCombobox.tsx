import { useQuery } from "@blitzjs/rpc"
import { Category, Prisma } from "@prisma/client"
import { useLocale } from "src/core/hooks/useLocale"
import { titleFor } from "src/core/helpers/content"
import { useController } from "react-hook-form"
import { useMemo } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/solid"
import { useTranslations } from "next-intl"
import { useModal } from "@ebay/nice-modal-react"
import { CreateCategoryModal } from "./CreateCategoryModal"
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories"
import { Loader, Select } from "@mantine/core"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/Array"
import { ItemSchema } from "src/items/validations"

export function FormCategoryCombobox() {
  const modal = useModal(CreateCategoryModal)
  const locale = useLocale()
  const t = useTranslations("admin.Components.FormCategoryCombobox")
  const [queryBag, { isRefetching }] = useQuery(getCurrentVenueCategories, {})

  const { field } = useController<ItemSchema, "categoryId">({
    name: "categoryId",
    defaultValue: pipe(
      queryBag.categories,
      A.head,
      O.map((c) => c.id),
      O.getOrElseW(() => undefined)
    ),
  })

  const title = useMemo(() => titleFor(locale), [locale])
  const data = useMemo(
    () =>
      pipe(
        queryBag.categories,
        A.map((category) => ({ label: title(category), value: String(category.id), category }))
      ),
    [title, queryBag]
  )

  return (
    <Select
      data={data}
      {...field}
      value={String(field.value)}
      onChange={(id) => field.onChange(Number(id))}
      label={t("category")}
      searchable
      creatable
      getCreateLabel={(query) => `+ Create ${query}`}
      onCreate={(query) => {
        modal.show({ name: query }).then((category) => {
          return field.onChange(String((category as Category).id))
        })
        return { value: "-1", label: query }
      }}
      rightSection={
        isRefetching ? (
          <Loader size={16} />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        )
      }
    />
  )
}
