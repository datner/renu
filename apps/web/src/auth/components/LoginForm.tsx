import Link from "next/link"
import { Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { AuthenticationError, PromiseReturnType } from "blitz"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import login from "src/auth/mutations/login"
import { Login } from "src/auth/validations"
import { FormProvider } from "react-hook-form"
import { useZodForm } from "src/core/hooks/useZodForm"

type LoginFormProps = {
  onSuccess(user: PromiseReturnType<typeof login>): void
}

export const LoginForm = (props: LoginFormProps) => {
  const { onSuccess } = props
  const [loginMutation] = useMutation(login)

  const form = useZodForm({
    schema: Login,
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { formState, handleSubmit, setFormError } = form
  const { isSubmitting } = formState

  const onSubmit = handleSubmit(async (data) => {
    try {
      onSuccess(await loginMutation(data))
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        return setFormError("Sorry, those credentials are invalid")
      }

      if (error instanceof Error) {
        return setFormError(
          "Sorry, we had an unexpected error. Please try again. - " + error.toString()
        )
      }

      return setFormError("Sorry, we had an unexpected error. Please try again.")
    }
  })

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={onSubmit}>
          <fieldset className="space-y-6" disabled={isSubmitting}>
            <LabeledTextField name="email" label="Email" placeholder="Email" />
            <LabeledTextField
              name="password"
              label="Password"
              placeholder="Password"
              type="password"
            />
          </fieldset>
          <div>
            <Link href={Routes.ForgotPasswordPage()}>Forgot your password?</Link>
          </div>
          <button
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            type="submit"
            disabled={isSubmitting}
          >
            Login
          </button>
        </form>
      </div>
    </FormProvider>
  )
}
