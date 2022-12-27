import { useMutation } from "@blitzjs/rpc"
import { useZodForm } from "src/core/hooks/useZodForm"
import { useRouter } from "next/router"
import login from "src/auth/mutations/login"
import { Login } from "src/auth/validations"
import { Routes } from "@blitzjs/next"
import { AuthenticationError } from "blitz"
import { Anchor, Button, Group, Loader, Paper, PasswordInput, TextInput } from "@mantine/core"

export function LoginForm() {
  const router = useRouter()
  const [loginMutation] = useMutation(login)
  const form = useZodForm({
    schema: Login,
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await loginMutation(data)
      router.push(Routes.AdminHome())
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        return form.setFormError("Sorry, those credentials are invalid")
      }

      if (error instanceof Error) {
        return form.setFormError(
          "Sorry, we had an unexpected error. Please try again. - " + error.toString()
        )
      }

      return form.setFormError("Sorry, we had an unexpected error. Please try again.")
    }
  })

  return (
    <Paper
      component="form"
      withBorder
      shadow="md"
      p={30}
      mt={30}
      radius="md"
      onSubmit={handleSubmit}
    >
      <fieldset disabled={form.formState.isSubmitting}>
        <TextInput
          {...form.register("email", { required: true })}
          label="Email"
          placeholder="you@renu.menu"
        />
        <PasswordInput
          {...form.register("password", { required: true })}
          label="Password"
          placeholder="your password"
          mt="md"
        />
        <Group position="apart" mt="md">
          <Anchor<"a"> size="sm" href="#" onClick={(e) => e.preventDefault()}>
            Forgot Password?
          </Anchor>
        </Group>
      </fieldset>
      <Button type="submit" fullWidth mt="xl">
        {form.formState.isSubmitting ? <Loader /> : "Sign In"}
      </Button>
    </Paper>
  )
}
