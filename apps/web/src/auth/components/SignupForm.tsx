import { useMutation } from "@blitzjs/rpc"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import signup from "src/auth/mutations/signup"
import { Signup } from "src/auth/validations"
import { useZodForm } from "src/core/hooks/useZodForm"
import { FormProvider } from "react-hook-form"

type SignupFormProps = {
  onSuccess?: () => void
}

export const SignupForm = (props: SignupFormProps) => {
  const { onSuccess } = props
  const [signupMutation] = useMutation(signup)

  const form = useZodForm({
    schema: Signup,
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { formState, handleSubmit, setFormError, setError } = form
  const { isSubmitting } = formState

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signupMutation(data)
      onSuccess?.()
    } catch (error: any) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        // This error comes from Prisma
        setError("email", { message: "This email is already being used" })
      } else {
        setFormError(error.toString())
      }
    }
  })

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600">
            Create an Account
          </h1>
        </div>
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

export default SignupForm
