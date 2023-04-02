import { invoke, useQuery } from "@blitzjs/rpc";
import { constNull, pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import { AdjustmentsVerticalIcon, DocumentTextIcon } from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/solid";
import { Button, NumberInput, Paper, Tabs, Textarea, TextInput } from "@mantine/core";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { FormProvider, useController } from "react-hook-form";
import { toast } from "react-toastify";
import { shekelFormatter, shekelParser } from "src/core/helpers/form";
import { useZodForm } from "src/core/hooks/useZodForm";
import { GetItemResult, ItemForm, ItemSchema, toDefaults } from "src/items/validations";
import getVenueManagementIntegration from "src/venues/queries/current/getVenueManagementIntegration";
import { match } from "ts-pattern";
import getUploadUrl from "../mutations/getUploadUrl";
import { DeleteButton } from "./DeleteButton";
import { FormCategoryCombobox } from "./FormCategoryCombobox";
import { FormDropzone } from "./FormDropzone";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { ModifierPanel } from "./ModifierPanel";

type Props = {
  item: O.Option<GetItemResult>;
  onSubmit(data: ItemForm): void;
};

export function ItemForm(props: Props) {
  const { onSubmit: onSubmit_, item } = props;
  const [integration] = useQuery(getVenueManagementIntegration, null);
  const t = useTranslations("admin.Components.ItemForm");
  const prevItem = useRef(item);
  const isEdit = O.isSome(item);
  const getDefaultValues = useMemo(() => toDefaults(integration), [integration]);
  const defaultValues = useMemo(() => getDefaultValues(item), [item, getDefaultValues]);
  const form = useZodForm({
    schema: ItemSchema,
    defaultValues,
  });
  const [isRemoving, remove] = useReducer(() => true, false);

  const { handleSubmit, setFormError, formState, reset, control, formError } = form;
  const { isSubmitting, isDirty, errors } = formState;

  useEffect(() => {
    const shouldReset = pipe(
      O.tuple(item, prevItem.current),
      O.filter(([i1, i2]) => i1.id === i2.id),
      O.isNone,
    );
    if (shouldReset) {
      reset(getDefaultValues(item));
    }
    prevItem.current = item;
  }, [item, getDefaultValues]);

  const onSubmit = handleSubmit(
    async (data) => {
      async function doAction() {
        let image = pipe(
          O.map(item, i => i.image),
          O.getOrElse(() => ""),
        );
        try {
          if (data.image.file) {
            const file = data.image.file;
            const { url, headers: h } = await invoke(getUploadUrl, {
              name: `${data.identifier}-${nanoid()}.${file.name.split(".").pop()}`,
            });
            const headers = new Headers(h);
            headers.append("Content-Length", `${file.size + 5000}`);

            const {
              data: {
                attributes: { origin_path },
              },
            } = await fetch(url, {
              method: "POST",
              headers,
              body: await file.arrayBuffer(),
            }).then((res) => res.json());
            image = origin_path;
          }
          return onSubmit_({ ...data, image });
        } catch (error: any) {
          setFormError(error.toString());
        }
      }
      const isCreate = O.isNone(item);
      await toast.promise(doAction(), {
        pending: `${isCreate ? "Creating" : "Updating"} in progress...`,
        success: `${data.identifier} ${isCreate ? "created" : "updated"} successfully!`,
        error: `Oops! Couldn't ${isCreate ? "create" : "update"} ${data.identifier}`,
      });
    },
    (e) => console.log(e),
  );

  const result = {
    isEdit,
    isSubmitting,
  };

  const message = match(result)
    .with({ isEdit: false, isSubmitting: true }, () => t("create.item"))
    .with({ isEdit: true, isSubmitting: true }, () => t("update.item"))
    .with({ isEdit: false }, () => t("create.initial"))
    .with({ isEdit: true }, () => t("update.initial"))
    .exhaustive();

  const title = pipe(
    item,
    O.match(
      () => t("title.new"),
      () => t("title.edit"),
    ),
  );

  const deleteButton = O.match(
    item,
    constNull,
    (it) => <DeleteButton identifier={it.identifier!} onRemove={remove} />,
  );

  const { field: priceProps } = useController({ control, name: "price" });

  if (formError) console.log(formError);

  return (
    <FormProvider {...form}>
      <Paper
        sx={{
          minHeight: 0,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
        withBorder
        radius="md"
        shadow="sm"
      >
        <div className="pb-4 pt-8 pl-4 pr-8 flex">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-emerald-600 grow">
            {title}
          </h1>
          <div>{deleteButton}</div>
        </div>
        <form className="grow min-h-0 flex flex-col" onSubmit={onSubmit}>
          <Tabs
            keepMounted={false}
            sx={{ flexGrow: 1, display: "flex", minHeight: 0, flexDirection: "column" }}
            classNames={{ panel: "border-b-2 flex flex-col grow min-h-0" }}
            defaultValue="general"
          >
            <Tabs.List px={24}>
              <Tabs.Tab value="general" icon={<DocumentTextIcon className="h-5 w-5" />}>
                General
              </Tabs.Tab>
              <Tabs.Tab value="modifiers" icon={<AdjustmentsVerticalIcon className="h-5 w-5" />}>
                Modifiers
              </Tabs.Tab>
              <Tabs.Tab
                disabled={integration.id === -1}
                value="integrations"
                icon={<PuzzlePieceIcon className="h-5 w-5" />}
              >
                Integrations
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general">
              <div className="p-4 flex gap-4">
                <fieldset className="space-y-2 flex-1" disabled={isSubmitting || isRemoving}>
                  <div className="flex gap-2 items-center">
                    <TextInput
                      {...form.register("identifier")}
                      label={t("identifier")}
                      placeholder="my-item"
                      error={errors.identifier?.message}
                    />
                    <FormCategoryCombobox />
                  </div>
                  <NumberInput
                    {...priceProps}
                    label={t("price")}
                    step={50}
                    min={0}
                    parser={shekelParser}
                    formatter={shekelFormatter}
                      error={errors.price?.message}
                  />
                  <div>
                    <TextInput
                      {...form.register("en.name")}
                      label={t("english name")}
                      placeholder="My Item"
                      error={errors.en?.name?.message}
                    />
                    <Textarea
                      {...form.register("en.description")}
                      label={t("english description")}
                      placeholder="My item is very nice and also cool"
                      error={errors.en?.description?.message}
                    />
                  </div>
                  <div>
                    <TextInput
                      {...form.register("he.name")}
                      label={t("hebrew name")}
                      placeholder="פריט שלי"
                      error={errors.he?.name?.message}
                    />
                    <Textarea
                      {...form.register("he.description")}
                      label={t("hebrew description")}
                      placeholder="הפריט שלי מאוד נחמד וגם מגניב"
                      error={errors.he?.description?.message}
                    />
                  </div>
                </fieldset>
                <div className="flex-1 flex flex-col">
                  <FormDropzone />
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="modifiers">
              <ModifierPanel />
            </Tabs.Panel>
            <Tabs.Panel value="integrations">
              <IntegrationsPanel />
            </Tabs.Panel>
            <div className="p-3">
              <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
                {message}
              </Button>
            </div>
          </Tabs>
        </form>
      </Paper>
    </FormProvider>
  );
}
