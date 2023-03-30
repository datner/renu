import { Button, createStyles, TextInput } from "@mantine/core";
import { PromiseReturnType } from "blitz";
import { useTranslations } from "next-intl";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import getCategory from "src/categories/queries/getCategory";
import { match, P } from "ts-pattern";

type Props = {
  item?: PromiseReturnType<typeof getCategory>;
  onSubmit(category: CategoryForm): Promise<void>;
  defaultValues?: DefaultValues<CategoryForm>;
};

export interface CategoryForm {
  identifier: string;
  en: { name: string; description?: string };
  he: { name: string; description?: string };
}

const DEFAULT_VALUES: DefaultValues<CategoryForm> = {
  identifier: "",
  en: { name: "" },
  he: { name: "" },
};

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
});

export function CategoryForm(props: Props) {
  const { defaultValues = DEFAULT_VALUES, onSubmit } = props;
  const { classes } = useStyles();
  const t = useTranslations("admin.Components.CategoryForm");
  const form = useForm<CategoryForm>({
    defaultValues,
  });

  const { handleSubmit, formState, register } = form;
  const { isSubmitting } = formState;

  const result = {
    defaultValues: props.defaultValues?.identifier,
    isSubmitting,
  };

  const message = match(result)
    .with({ defaultValues: P.nullish, isSubmitting: true }, () => t("create.category"))
    .with({ defaultValues: P._, isSubmitting: true }, () => t("update.category"))
    .with({ defaultValues: P.nullish }, () => t("create.initial"))
    .with({ defaultValues: P._ }, () => t("update.initial"))
    .exhaustive();

  return (
    <FormProvider {...form}>
      <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4 h-16 flex">
          <h2 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-emerald-600 grow">
            {props.defaultValues ? t("title.edit") : t("title.new")}
          </h2>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1 font-mono" disabled={isSubmitting}>
              <TextInput
                classNames={{ input: classes.mono }}
                {...register("identifier", {
                  pattern: {
                    value: /^[a-z0-9-]+[^-]$/,
                    message: "Slug should contain only lowercase letters, and numbers. Seperated by dashes",
                  },
                })}
                label={t("identifier")}
                placeholder="my-category"
              />
              <TextInput
                {...register("en.name", { required: true })}
                label={t("english name")}
                placeholder="My Category"
              />
              <TextInput
                {...register("he.name", { required: true })}
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
  );
}
