import { useMutation, useQuery } from "@blitzjs/rpc"
import { useZodForm } from "src/core/hooks/useZodForm"
import { GetItemResult, ItemSchema, toDefaults } from "src/items/validations"
import { useTranslations } from "next-intl"
import { FormProvider, useController } from "react-hook-form"
import getUploadUrl from "../mutations/getUploadUrl"
import { FormDropzone } from "./FormDropzone"
import { FC, PropsWithChildren, useReducer } from "react"
import { match } from "ts-pattern"
import { FormCategoryCombobox } from "./FormCategoryCombobox"
import { DeleteButton } from "./DeleteButton"
import { pipe, constNull, flow, constTrue } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import * as O from "fp-ts/Option"
import * as Eq from "fp-ts/Eq"
import { useStableEffect } from "fp-ts-react-stable-hooks"
import { eqItem } from "src/items/helpers/eqItem"
import { nanoid } from "nanoid"
import { toast } from "react-toastify"
import { Button, NumberInput, Paper, Tabs, Textarea, TextInput } from "@mantine/core"
import { DocumentTextIcon, AdjustmentsVerticalIcon } from "@heroicons/react/20/solid"
import { ModifierPanel } from "./ModifierPanel"
import { shekelFormatter, shekelParser } from "src/core/helpers/form"
import { PuzzlePieceIcon } from "@heroicons/react/24/solid"
import { IntegrationsPanel } from "./IntegrationsPanel"
import getVenueManagementIntegration from "src/venues/queries/current/getVenueManagementIntegration"

type Props = {
  item: O.Option<GetItemResult>
  onSubmit(data: ItemSchema): TE.TaskEither<string, GetItemResult>
}

const ItemFormTabs: FC<PropsWithChildren<unknown>> = ({ children }) => (
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
      <Tabs.Tab value="integrations" icon={<PuzzlePieceIcon className="h-5 w-5" />}>
        Integrations
      </Tabs.Tab>
    </Tabs.List>
    {children}
  </Tabs>
)

export function ItemForm(props: Props) {
  const { onSubmit: onSubmit_, item } = props
  const [integration] = useQuery(getVenueManagementIntegration, null)
  const t = useTranslations("admin.Components.ItemForm")
  const isEdit = O.isSome(item)
  const defaultValues = toDefaults(integration)(item)
  const form = useZodForm({
    schema: ItemSchema,
    defaultValues,
  })
  const [getAssetUrl, uploadUrl] = useMutation(getUploadUrl)
  const [isRemoving, remove] = useReducer(() => true, false)

  const { handleSubmit, setFormError, formState, reset, control, formError } = form
  const { isSubmitting, isDirty } = formState

  useStableEffect(
    () => {
      pipe(item, toDefaults(integration), reset)
    },
    [item, reset, integration],
    Eq.tuple(O.getEq(eqItem), { equals: constTrue }, { equals: constTrue })
  )

  const onSubmit = handleSubmit(
    async (data) => {
      async function doAction() {
        const { image } = data
        const file = image.file
        try {
          if (file) {
            const { url, headers: h } = await getAssetUrl({
              name: `${data.identifier}-${nanoid()}.${file.name.split(".").pop()}`,
            })
            const headers = new Headers(h)
            headers.append("Content-Length", `${file.size + 5000}`)

            const {
              data: {
                attributes: { origin_path },
              },
            } = await fetch(url, {
              method: "POST",
              headers,
              body: await file.arrayBuffer(),
            }).then((res) => res.json())
            image.src = origin_path
          }
          await pipe(
            onSubmit_(data),
            TE.match(setFormError, flow(O.some, toDefaults(integration), reset))
          )()
        } catch (error: any) {
          setFormError(error.toString())
        }
      }
      const isCreate = O.isNone(item)
      await toast.promise(doAction(), {
        pending: `${isCreate ? "Creating" : "Updating"} in progress...`,
        success: `${data.identifier} ${isCreate ? "created" : "updated"} successfully!`,
        error: `Oops! Couldn't ${isCreate ? "create" : "update"} ${data.identifier}`,
      })
    },
    (e) => console.log(e)
  )

  const result = {
    isEdit,
    isSubmitting,
  }

  const message = match(uploadUrl.isLoading)
    .with(true, () => t("upload"))
    .otherwise(() =>
      match(result)
        .with({ isEdit: false, isSubmitting: true }, () => t("create.item"))
        .with({ isEdit: true, isSubmitting: true }, () => t("update.item"))
        .with({ isEdit: false }, () => t("create.initial"))
        .with({ isEdit: true }, () => t("update.initial"))
        .exhaustive()
    )

  const title = pipe(
    item,
    O.match(
      () => t("title.new"),
      () => t("title.edit")
    )
  )

  const deleteButton = pipe(
    item,
    O.matchW(constNull, (it) => <DeleteButton identifier={it.identifier!} onRemove={remove} />)
  )

  const { field: priceProps } = useController({ control, name: "price" })

  if (formError) console.log(formError)

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
          <ItemFormTabs>
            <Tabs.Panel value="general">
              <div className="p-4 flex gap-4">
                <fieldset className="space-y-2 flex-1" disabled={isSubmitting || isRemoving}>
                  <div className="flex gap-2 items-center">
                    <TextInput
                      {...form.register("identifier")}
                      label={t("identifier")}
                      placeholder="my-item"
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
                  />
                  <div>
                    <TextInput
                      {...form.register("en.name")}
                      label={t("english name")}
                      placeholder="My Item"
                    />
                    <Textarea
                      {...form.register("en.description")}
                      label={t("english description")}
                      placeholder="My item is very nice and also cool"
                    />
                  </div>
                  <div>
                    <TextInput
                      {...form.register("he.name")}
                      label={t("hebrew name")}
                      placeholder="פריט שלי"
                    />
                    <Textarea
                      {...form.register("he.description")}
                      label={t("hebrew description")}
                      placeholder="הפריט שלי מאוד נחמד וגם מגניב"
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
          </ItemFormTabs>
        </form>
      </Paper>
    </FormProvider>
  )
}
