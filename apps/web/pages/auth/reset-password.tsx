import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { BlitzPage, Routes, useRouterQuery } from "@blitzjs/next"
import Layout from "src/core/layouts/Layout"
import { FORM_ERROR } from "src/core/components/Form"
import { ResetPassword } from "src/auth/validations"
import resetPassword from "src/auth/mutations/resetPassword"
import { useZodForm } from "src/core/hooks/useZodForm"
import { Button, Paper, PasswordInput, Container } from "@mantine/core"
import { useEffect } from "react"

const ResetPasswordPage: BlitzPage = () => {
  const token = (useRouterQuery().token as string) ?? ""
  const [resetPasswordMutation, { isSuccess }] = useMutation(resetPassword)
  const form = useZodForm({
    reValidateMode: "onChange",
    defaultValues: {
      token,
    },
    schema: ResetPassword,
  })
  const { register, getFieldState, formState } = form

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        await resetPasswordMutation(values)
      } catch (error: any) {
        if (error.name === "ResetPasswordError") {
          return {
            [FORM_ERROR]: error.message,
          }
        } else {
          return {
            [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again.",
          }
        }
      }
    },
    (a) => console.log(a)
  )

  useEffect(() => {
    register("token", { value: token })
  })

  return (
    <Container size="xs">
      <Paper sx={{ width: 460 }} withBorder shadow="md" p={30} mt={30} radius="md">
        {isSuccess ? (
          <div>
            <h2>Password Reset Successfully</h2>
            <p>
              Go to the <Link href={Routes.Authentication()}>homepage</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <h1 className="text-lg font-medium">Set a New Password</h1>
            <fieldset className="space-y-6" disabled={formState.isSubmitting}>
              <PasswordInput
                label="New Password"
                {...register("password")}
                error={getFieldState("password", formState).error?.message}
              />
              <PasswordInput
                label="Confirm New Password"
                {...register("passwordConfirmation")}
                error={getFieldState("passwordConfirmation", formState).error?.message}
              />
            </fieldset>
            <Button type="submit" loading={formState.isSubmitting}>
              {formState.isSubmitting ? "Changing password..." : "Submit"}
            </Button>
          </form>
        )}
      </Paper>
    </Container>
  )
}

ResetPasswordPage.redirectAuthenticatedTo = "/"
ResetPasswordPage.getLayout = (page) => <Layout title="Reset Your Password">{page}</Layout>

export default ResetPasswordPage
