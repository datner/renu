import { useQuery } from "@blitzjs/rpc";
import { useModal } from "@ebay/nice-modal-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Loader, Select } from "@mantine/core";
import { Category } from "database";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useController } from "react-hook-form";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import { titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { ItemSchema } from "src/items/validations";
import { CreateCategoryModal } from "./CreateCategoryModal";

export function FormCategoryCombobox() {
  const modal = useModal(CreateCategoryModal);
  const locale = useLocale();
  const t = useTranslations("admin.Components.FormCategoryCombobox");
  const [queryBag, { isRefetching }] = useQuery(getCurrentVenueCategories, {});

  const { field } = useController<ItemSchema, "categoryId">({
    name: "categoryId",
    defaultValue: pipe(
      queryBag.categories,
      A.head,
      O.map((c) => c.id),
      O.getOrElseW(() => undefined),
    ),
  });

  const title = useMemo(() => titleFor(locale), [locale]);
  const data = useMemo(
    () =>
      pipe(
        queryBag.categories,
        A.map((category) => ({ label: title(category.content as any), value: String(category.id), category })),
      ),
    [title, queryBag],
  );

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
          return field.onChange((category as Category).id);
        });
        return { value: "-1", label: query };
      }}
      rightSection={isRefetching
        ? <Loader size={16} />
        : <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
    />
  );
}
