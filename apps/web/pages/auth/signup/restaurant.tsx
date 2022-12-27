import { BlitzPage, Routes } from "@blitzjs/next"
import { useRouter } from "next/router"
import Layout from "src/core/layouts/Layout"
import { RestaurantForm } from "src/auth/components/ResuaurantForm"

const RestaurantSignupPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-full flex bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RestaurantForm onSuccess={() => router.push(Routes.AdminHome())} />
      </div>
    </div>
  )
}

RestaurantSignupPage.authenticate = true
RestaurantSignupPage.getLayout = (page) => <Layout title="Sign Up">{page}</Layout>

export default RestaurantSignupPage
