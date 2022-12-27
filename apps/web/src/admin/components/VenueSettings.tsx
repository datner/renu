import { Button, Container, Paper, TextInput } from "@mantine/core"
import { useTranslations } from "next-intl"
import { useMutation } from "@blitzjs/rpc"
import { useZodForm } from "src/core/hooks/useZodForm"
import { Settings } from "src/admin/validations/settings"
import updateAddress from "src/admin/mutations/updateAddress"

export function VenueSettings() {
  const t = useTranslations("admin.Components.VenueSettings")
  const form = useZodForm({
    schema: Settings,
  })
  const [updateSettings] = useMutation(updateAddress)

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateSettings(data)
  })

  return (
    <Container p="lg">
      <Paper
        sx={{ width: 440 }}
        component="form"
        withBorder
        shadow="md"
        p={30}
        mt={30}
        radius="md"
        onSubmit={handleSubmit}
      >
        <fieldset disabled={form.formState.isSubmitting}>
          <TextInput {...form.register("address")} label={t("address")} />
          <TextInput {...form.register("phone")} label={t("phone number")} />
        </fieldset>
        <Button mt={16} type="submit" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("updating") : t("update")}
        </Button>
      </Paper>
    </Container>
  )
}
