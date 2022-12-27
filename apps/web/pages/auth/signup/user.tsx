import { BlitzPage, Routes } from "@blitzjs/next"
import { useRouter } from "next/router"
import Layout from "src/core/layouts/Layout"
import { SignupForm } from "src/auth/components/SignupForm"

const UserSignupPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-full flex bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm onSuccess={() => router.push(Routes.RestaurantSignupPage())} />
      </div>
    </div>
  )
}

UserSignupPage.redirectAuthenticatedTo = Routes.RestaurantSignupPage()
UserSignupPage.getLayout = (page) => <Layout title="Sign Up">{page}</Layout>

export default UserSignupPage
