import { useQuery } from "@blitzjs/rpc";
import { useModal } from "@ebay/nice-modal-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Combobox, InputBase, Loader, useCombobox } from "@mantine/core";
import { Category } from "database";
import { Option, pipe, ReadonlyArray } from "effect";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useController } from "react-hook-form";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import { titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import { ItemFormSchema } from "../validations/item-form";
import { CreateCategoryModal } from "./CreateCategoryModal";

export function FormCategoryCombobox() {
  const modal = useModal(CreateCategoryModal);
  const locale = useLocale();
  const t = useTranslations("admin.Components.FormCategoryCombobox");
  const [queryBag, { isRefetching, refetch }] = useQuery(getCurrentVenueCategories, {});
  const { field } = useController<ItemFormSchema, "categoryId">({
    name: "categoryId",
  });
  const [query, setQuery] = useState(() =>
    ReadonlyArray.findFirst(queryBag.categories, _ => _.id === field.value).pipe(
      Option.map(_ => _.content),
      Option.flatMapNullable(_ => title(_ as any)),
      Option.getOrElse(() => ""),
    )
  );

  const combobox = useCombobox();

  const title = useMemo(() => titleFor(locale), [locale]);
  const { options, exact } = useMemo(
    () => {
      const q = query.trim().toLowerCase();
      let exact = false;
      return {
        exact,
        options: pipe(
          queryBag.categories.filter(_ =>
            q.startsWith(String(_.id)) || _.identifier.includes(q)
            || _.content.some(_ =>
              _.name.toLowerCase().includes(q)
              || _.description?.toLowerCase().includes(q)
            )
          ).map(_ => {
            if (
              [
                ..._.content.flatMap(_ => [_.name.toLowerCase(), _.description?.toLowerCase() ?? ""]),
                String(_.id),
                _.identifier,
              ].includes(q)
            ) {
              exact = true;
            }
            return (
              <Combobox.Option value={String(_.id)} key={_.id}>
                {title(_.content as any)}
              </Combobox.Option>
            );
          }),
        ),
      };
    },
    [title, queryBag, query],
  );

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(val) => {
        if (val === "$create") {
          modal.show({ name: query }).then((category) => {
            refetch();
            return field.onChange((category as Category).id);
          });
        } else {
          const cat = ReadonlyArray.findFirst(queryBag.categories, _ => _.id === Number(val)).pipe(
            Option.getOrThrow,
          );

          field.onChange(cat.id);
          setQuery(title(cat.content as any));
        }

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={t("category")}
          rightSection={isRefetching
            ? <Loader size={16} />
            : <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
          value={query}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setQuery(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            const cat = ReadonlyArray.findFirst(queryBag.categories, _ => _.id === Number(field.value)).pipe(
              Option.getOrThrow,
            );

            setQuery(title(cat.content as any));
          }}
          placeholder="Search value"
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options}
          {!exact && query.trim().length > 0 && <Combobox.Option value="$create">+ Create {query}</Combobox.Option>}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
