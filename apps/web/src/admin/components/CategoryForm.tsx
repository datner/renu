import { Button, TextInput } from "@mantine/core";
import { PromiseReturnType } from "blitz";
import { Match, pipe } from "effect";
import { useTranslations } from "next-intl";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import getCategory from "src/categories/queries/getCategory";
import { CategoryForm } from "src/categories/validations";

type Props = {
  item?: PromiseReturnType<typeof getCategory>;
  onSubmit(category: CategoryForm): Promise<void>;
  defaultValues?: DefaultValues<CategoryForm>;
};

const DEFAULT_VALUES: DefaultValues<CategoryForm> = {
  identifier: "",
  en: { name: "" },
  he: { name: "" },
};

// no not that one
type Result = {
  defaultValues: string | undefined;
  isSubmitting: boolean;
};

const key = Match.type<Result>().pipe(
  Match.when({ defaultValues: Match.undefined, isSubmitting: true }, () => "create.category" as const),
  Match.when({ isSubmitting: true }, () => "update.category" as const),
  Match.when({ defaultValues: Match.undefined }, () => "create.initial" as const),
  Match.orElse(() => "update.initial" as const),
);

export function CategoryForm(props: Props) {
  const { defaultValues = DEFAULT_VALUES, onSubmit } = props;
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

  const message = pipe(result, key, t);

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
                classNames={{ input: "font-mono" }}
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
