import { constNull, pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import * as Match from "@effect/match";
import * as Schema from "@effect/schema/Schema";
import { AdjustmentsVerticalIcon, DocumentTextIcon } from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/solid";
import { Button, NumberInput, Paper, Tabs, Textarea, TextInput } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useReducer } from "react";
import { FormProvider, useController, useForm, UseFormHandleSubmit } from "react-hook-form";
import { toast } from "react-toastify";
import { Item, ModifierConfig } from "shared";
import { Schema as SchemaUtils } from "shared/effect";
import { shekelFormatter, shekelParser } from "src/core/helpers/form";
import { FullItem } from "src/items/hooks/form";
import { match } from "ts-pattern";
import { ExtrasSchema, ItemFormSchema, ModifierSchema, OneOfSchema } from "../validations/item-form";
import { DeleteButton } from "./DeleteButton";
import { FormCategoryCombobox } from "./FormCategoryCombobox";
import { FormDropzone } from "./FormDropzone";
import { ModifierPanel } from "./ModifierPanel";
import { PrestoIntegrationPanel } from "./PrestoIntegrationPanel";

type Props = {
  item: O.Option<FullItem>;
  onSubmit(data: Schema.To<typeof ItemFormSchema>): Promise<void>;
};

type F = Schema.From<typeof ItemFormSchema>;
const toDefaultModifier = pipe(
  Match.type<Item.Modifier.Modifier>(),
  Match.tag("OneOf", (_): OneOfSchema => ({
    _tag: "oneOf",
    identifier: _.config.identifier,
    defaultOption: _.config.defaultOption,
    content: RR.fromIterable(
      _.config.content,
      _ => [_.locale, { name: _.name, description: O.getOrElse(_.description, () => "") }],
    ) as any,
    options: A.mapNonEmpty(_.config.options, _ => ({
      identifier: _.identifier,
      content: RR.fromIterable(
        _.content,
        _ => [_.locale, { name: _.name, description: O.getOrElse(_.description, () => "") }],
      ) as any,
      managementRepresentation: Schema.encode(ModifierConfig.Base.ManagementRepresentationSchema)(
        _.managementRepresentation,
      ),
      price: _.price,
    })),
  })),
  Match.tag("Extras", (_): ExtrasSchema => ({
    _tag: "extras",
    identifier: _.config.identifier,
    max: O.getOrElse(_.config.max, () => 0),
    min: O.getOrElse(_.config.min, () => 0),
    content: RR.fromIterable(
      _.config.content,
      _ => [_.locale, { name: _.name, description: O.getOrElse(_.description, () => "") }],
    ) as any,
    options: A.mapNonEmpty(_.config.options, _ => ({
      identifier: _.identifier,
      content: RR.fromIterable(
        _.content,
        _ => [_.locale, { name: _.name, description: O.getOrElse(_.description, () => "") }],
      ) as any,
      managementRepresentation: Schema.encode(ModifierConfig.Base.ManagementRepresentationSchema)(
        _.managementRepresentation,
      ),
      price: _.price,
      multi: _.multi,
    })),
  })),
  Match.tag("Slider", _ => {
    throw "not there yet";
  }),
  Match.exhaustive,
);

const toDefault = (item: O.Option<FullItem>): F =>
  pipe(
    O.match(
      item,
      (): F => ({
        price: 0,
        identifier: "",
        categoryId: -1,
        modifiers: [],
        image: {
          src: "",
        },
        content: {
          en: { name: "", description: "" },
          he: { name: "", description: "" },
        },
      }),
      _ => ({
        price: _.price,
        identifier: _.identifier,
        categoryId: _.categoryId,
        image: {
          src: _.image,
          blur: O.getOrUndefined(_.blurHash),
        },
        modifiers: A.map(_.modifiers, (_): ModifierSchema => ({
          modifierId: _.id,
          config: toDefaultModifier(_),
        })),
        content: RR.fromIterable(
          _.content,
          _ => [_.locale, { name: _.name, description: O.getOrElse(_.description, () => "") }],
        ) as any,
      }),
    ),
  );

export function ItemForm(props: Props) {
  const { onSubmit: onSubmit_, item } = props;
  const t = useTranslations("admin.Components.ItemForm");
  const isEdit = O.isSome(item);
  const form = useForm({
    resolver: SchemaUtils.schemaResolver(ItemFormSchema),
    defaultValues: async (_) => {
      return toDefault(item);
    },
  });
  const [isRemoving, remove] = useReducer(() => true, false);

  const { formState, control, getValues } = form;
  const { isSubmitting, isDirty, errors } = formState;

  // patches a react-hook-form type limitation
  const handleSubmit = form.handleSubmit as any as UseFormHandleSubmit<Schema.To<typeof ItemFormSchema>>;
  const onSubmit = handleSubmit(
    async (data) => {
      console.log(data);
      const isCreate = O.isNone(item);
      await toast.promise(onSubmit_(data), {
        pending: `${isCreate ? "Creating" : "Updating"} in progress...`,
        success: `${data.identifier} ${isCreate ? "created" : "updated"} successfully!`,
        error: `Oops! Couldn't ${isCreate ? "create" : "update"} ${data.identifier}`,
      });
    },
    (e) => console.log(e, getValues()),
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
                disabled={O.isNone(item)}
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
                      {...form.register("content.en.name")}
                      label={t("english name")}
                      placeholder="My Item"
                      error={errors.content?.en?.name?.message}
                    />
                    <Textarea
                      {...form.register("content.en.description")}
                      label={t("english description")}
                      placeholder="My item is very nice and also cool"
                      error={errors.content?.en?.description?.message}
                    />
                  </div>
                  <div>
                    <TextInput
                      {...form.register("content.he.name")}
                      label={t("hebrew name")}
                      placeholder="פריט שלי"
                      error={errors.content?.he?.name?.message}
                    />
                    <Textarea
                      {...form.register("content.he.description")}
                      label={t("hebrew description")}
                      placeholder="הפריט שלי מאוד נחמד וגם מגניב"
                      error={errors.content?.he?.description?.message}
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
              <PrestoIntegrationPanel />
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
