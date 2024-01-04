import { invoke } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { AdjustmentsVerticalIcon, DocumentTextIcon } from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/solid";
import { Button, NumberInput, Paper, Tabs, Textarea, TextInput } from "@mantine/core";
import { Match, Option, pipe, ReadonlyArray, ReadonlyRecord } from "effect";
import { constNull } from "effect/Function";
import { useTranslations } from "next-intl";
import { useReducer } from "react";
import { FormProvider, useController, useForm, UseFormHandleSubmit } from "react-hook-form";
import { toast } from "react-toastify";
import { Item, ModifierConfig } from "shared";
import { Schema as SchemaUtils } from "shared/effect";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import { FullItem } from "src/items/helpers/form";
import { ExtrasSchema, ItemFormSchema, ModifierSchema, OneOfSchema } from "../validations/item-form";
import { DeleteButton } from "./DeleteButton";
import { FormCategoryCombobox } from "./FormCategoryCombobox";
import { FormDropzone } from "./FormDropzone";
import { ModifierPanel } from "./ModifierPanel";
import { PrestoIntegrationPanel } from "./PrestoIntegrationPanel";

type Props = {
  item: Option.Option<FullItem>;
  onSubmit(data: Schema.Schema.To<typeof ItemFormSchema>): Promise<void>;
};

type F = Schema.Schema.From<typeof ItemFormSchema>;
const toDefaultModifier = Match.type<Item.Modifier.Modifier>().pipe(
  Match.tag("OneOf", (_): OneOfSchema => ({
    _tag: "oneOf",
    identifier: _.config.identifier,
    defaultOption: _.config.defaultOption,
    content: ReadonlyRecord.fromIterableWith(
      _.config.content,
      _ => [_.locale, { name: _.name, description: Option.getOrElse(_.description, () => "") }],
    ) as any,
    options: ReadonlyArray.map(_.config.options, _ => ({
      identifier: _.identifier,
      content: ReadonlyRecord.fromIterableWith(
        _.content,
        _ => [_.locale, { name: _.name, description: Option.getOrElse(_.description, () => "") }],
      ) as any,
      managementRepresentation: Schema.encodeSync(ModifierConfig.Base.ManagementRepresentationSchema)(
        _.managementRepresentation,
      ),
      price: _.price,
    })),
  })),
  Match.tag("Extras", (_): ExtrasSchema => ({
    _tag: "extras",
    identifier: _.config.identifier,
    max: Option.getOrElse(_.config.max, () => 0),
    min: Option.getOrElse(_.config.min, () => 0),
    content: ReadonlyRecord.fromIterableWith(
      _.config.content,
      _ => [_.locale, { name: _.name, description: Option.getOrElse(_.description, () => "") }],
    ) as any,
    options: ReadonlyArray.map(_.config.options, _ => ({
      identifier: _.identifier,
      content: ReadonlyRecord.fromIterableWith(
        _.content,
        _ => [_.locale, { name: _.name, description: Option.getOrElse(_.description, () => "") }],
      ) as any,
      managementRepresentation: Schema.encodeSync(ModifierConfig.Base.ManagementRepresentationSchema)(
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

const toDefault = async (item: Option.Option<FullItem>): Promise<F> => {
  const { categories } = await invoke(getCurrentVenueCategories, {});
  const categoryId = pipe(
    ReadonlyArray.head(categories),
    Option.map(_ => _.id),
    Option.orElse(() => Option.map(item, _ => _.categoryId)),
    Option.getOrElse(() => -1),
  );

  return Option.match(
    item,
    {
      onNone: (): F => ({
        price: 0,
        categoryId,
        identifier: "",
        modifiers: [],
        image: {
          src: "",
        },
        content: {
          en: { name: "", description: "" },
          he: { name: "", description: "" },
        },
      }),
      onSome: _ => ({
        price: _.price,
        identifier: _.identifier,
        categoryId: _.categoryId,
        image: {
          src: _.image,
          blur: Option.getOrUndefined(_.blurHash),
        },
        modifiers: ReadonlyArray.map(_.modifiers, (_): ModifierSchema => ({
          modifierId: _.id,
          config: toDefaultModifier(_),
        })),
        content: ReadonlyRecord.fromIterableWith(
          _.content,
          _ => [_.locale, { name: _.name, description: Option.getOrElse(_.description, () => "") }],
        ) as any,
      }),
    },
  );
};

export function ItemForm(props: Props) {
  const { onSubmit: onSubmit_, item } = props;
  const t = useTranslations("admin.Components.ItemForm");
  const isEdit = Option.isSome(item);
  const form = useForm({
    resolver: SchemaUtils.schemaResolver(Schema.from(ItemFormSchema)),
    defaultValues: async (_) => {
      return toDefault(item);
    },
  });
  const [isRemoving, remove] = useReducer(() => true, false);

  const { formState, control, getValues } = form;
  const { isSubmitting, isDirty, errors } = formState;

  // patches a react-hook-form type limitation
  const handleSubmit = form.handleSubmit as any as UseFormHandleSubmit<Schema.Schema.To<typeof ItemFormSchema>>;
  const onSubmit = handleSubmit(
    async (data) => {
      console.log(data);
      const isCreate = Option.isNone(item);
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

  const message = Match.value(result).pipe(
    Match.when({ isEdit: false, isSubmitting: true }, _ => t("create.item")),
    Match.when({ isEdit: true, isSubmitting: true }, _ => t("update.item")),
    Match.when({ isEdit: false, isSubmitting: false }, _ => t("create.initial")),
    Match.when({ isEdit: true, isSubmitting: false }, _ => t("update.initial")),
    Match.exhaustive,
  );

  const title = pipe(
    item,
    Option.match({
      onNone: () => t("title.new"),
      onSome: () => t("title.edit"),
    }),
  );

  const deleteButton = Option.match(
    item,
    {
      onNone: constNull,
      onSome: (it) => <DeleteButton identifier={it.identifier!} onRemove={remove} />,
    },
  );

  const { field: priceProps } = useController({ control, name: "price" });

  return (
    <FormProvider {...form}>
      <Paper
        className="min-h-0 grow flex flex-col"
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
            className="min-h-0 grow flex flex-col"
            classNames={{ panel: "border-b-2 flex flex-col grow min-h-0" }}
            defaultValue="general"
          >
            <Tabs.List px={24}>
              <Tabs.Tab value="general" leftSection={<DocumentTextIcon className="h-5 w-5" />}>
                General
              </Tabs.Tab>
              <Tabs.Tab value="modifiers" leftSection={<AdjustmentsVerticalIcon className="h-5 w-5" />}>
                Modifiers
              </Tabs.Tab>
              <Tabs.Tab
                disabled={Option.isNone(item)}
                value="integrations"
                leftSection={<PuzzlePieceIcon className="h-5 w-5" />}
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
                    onChange={_ => priceProps.onChange(+_ * 100 || 0)}
                    label={t("price")}
                    step={0.5}
                    allowNegative={false}
                    prefix="₪"
                    decimalScale={2}
                    fixedDecimalScale
                    thousandSeparator
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
