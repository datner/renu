import { invoke, useQuery } from "@blitzjs/rpc";
import * as E from "@effect/data/Either";
import { constNull, pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import * as Match from "@effect/match";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { AdjustmentsVerticalIcon, DocumentTextIcon } from "@heroicons/react/20/solid";
import { PuzzlePieceIcon } from "@heroicons/react/24/solid";
import { Button, NumberInput, Paper, Tabs, Textarea, TextInput } from "@mantine/core";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { DefaultValues, FormProvider, UseFormHandleSubmit, useController, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Category } from "shared";
import { Common, Number } from "shared/schema";
import { shekelFormatter, shekelParser } from "src/core/helpers/form";
import { useZodForm } from "src/core/hooks/useZodForm";
import { GetItemResult, toDefaults } from "src/items/validations";
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
  onSubmit(data: Schema.To<typeof Form>): void;
};

const Content_ = Schema.struct({ name: Schema.string, description: Schema.string })
const Content = Schema.struct({
  en: Content_,
  he: Content_
})

const ExtrasOption = Schema.struct({
  identifier: Common.Slug,
  managementId: Schema.nullable(Schema.string),
  price: Number.Price,
  multi: Schema.boolean,
  content: Content
})

const ExtrasSchema = Schema.struct({
  _tag: Schema.literal("extras"),
  identifier: Common.Slug,
  content: Content,
  options: Schema.nonEmptyArray(ExtrasOption),
  min: Schema.number,
  max: Schema.number
})
const OneOfOption = Schema.struct({
  identifier: Common.Slug,
  managementId: Schema.nullable(Schema.string),
  price: Number.Price,
  content: Content
})

const OneOfSchema = Schema.struct({
  _tag: Schema.literal("oneOf"),
  defaultOption: Schema.string,
  identifier: Common.Slug,
  content: Content,
  options: Schema.nonEmptyArray(OneOfOption),
})

const ModifierSchema = Schema.struct({
  modifierId: Schema.optional(Schema.number),
  managementId: Schema.optional(Schema.number),
  config: Schema.union(
    OneOfSchema,
    ExtrasSchema
  )
})
const Form = Schema.struct({
  identifier: Common.Slug,
  categoryId: Category.Id,
  price: Number.Price,
  content: Content,
  // image: Schema.union(Schema.instanceOf(FileList),Schema.string)
  image: Schema.struct({
    file: Schema.any,
    src: Schema.string,
    blur: Schema.optional(Schema.string),
  }),
  modifiers: Schema.array(ModifierSchema)
});
interface Form extends Schema.From<typeof Form> { }

type Entry = [string, { readonly message: string }];

const buildError = (error: ParseResult.ParseErrors, path = [] as string[]): Array<Entry> =>
  pipe(
    Match.value(error),
    Match.tag("Key", (e) => A.flatMap(e.errors, _ => buildError(_, A.append(path, String(e.key))))),
    Match.tag("Index", (e) => A.flatMap(e.errors, _ => buildError(_, A.append(path, String(e.index))))),
    Match.tag("UnionMember", (e) => A.flatMap(e.errors, _ => buildError(_, path))),
    Match.tag("Type", (_) => [
      [A.join(path, "."), {
        message: O.getOrElse(_.message, () => `expected: ${_.expected._tag} actual: ${_.actual}`),
      }] as Entry,
    ]),
    Match.tag("Missing", (_) => [[A.join(path, "."), { message: "Missing" }] as Entry]),
    Match.tag("Forbidden", (_) => [[A.join(path, "."), { message: "Forbidden" }] as Entry]),
    Match.tag("Unexpected", (_) => [[A.join(path, "."), { message: `Unexpected: ${_.actual}` }] as Entry]),
    Match.exhaustive,
  );

const schemaResolver = <I, A>(schema: Schema.Schema<I, A>) => (data: I, _context: any) =>
  pipe(
    Schema.decodeEither(schema)(data, { errors: "all" }),
    E.match(({ errors }) => {
      return ({
        values: {},
        errors: RR.fromEntries(A.flatMap(errors, _ => buildError(_))),
      });
    }, values => ({ values, errors: {} })),
  );

type DD = DefaultValues<Schema.From<typeof Form>>

export function ItemForm(props: Props) {
  const { onSubmit: onSubmit_, item } = props;
  const [integration] = useQuery(getVenueManagementIntegration, null);
  const t = useTranslations("admin.Components.ItemForm");
  const prevItem = useRef(item);
  const isEdit = O.isSome(item);
  const getDefaultValues = useMemo(() => toDefaults(integration), [integration]);
  const defaultValues = useMemo(() => getDefaultValues(item) as DD, [item, getDefaultValues]);
  const form = useForm({
    resolver: schemaResolver(Form),
    // resolver: ItemSchema,
    defaultValues,
  });
  const [isRemoving, remove] = useReducer(() => true, false);

  const { formState, reset, control } = form;
  const handleSubmit = form.handleSubmit as UseFormHandleSubmit<Schema.To<typeof Form>>
  const { isSubmitting, isDirty, errors } = formState;

  useEffect(() => {
    const shouldReset = pipe(
      O.tuple(item, prevItem.current),
      O.filter(([i1, i2]) => i1.id === i2.id),
      O.isNone,
    );
    if (shouldReset) {
      reset(getDefaultValues(item) as DD);
    }
    prevItem.current = item;
  }, [item, getDefaultValues, reset]);

  const onSubmit = handleSubmit(
    async (data) => {
      async function doAction() {
        let image = pipe(
          O.map(item, i => i.image),
          O.getOrElse(() => ""),
        );
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
          return onSubmit_(data);
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
