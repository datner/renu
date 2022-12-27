import { gSSP } from "src/blitz-server"
import { BlitzPage, Routes } from "@blitzjs/next"
import { AdminLayout } from "src/core/layouts/AdminLayout"
import { Suspense } from "react"
import { Content } from "src/admin/components/Content"
import { ToggleVenueOpen } from "src/admin/components/ToggleVenueOpen"
import { LoadingOverlay } from "@mantine/core"

const AdminHome: BlitzPage = () => {
  return (
    <Content
      main={
        <Suspense fallback={<LoadingOverlay visible />}>
          <div className="px-8 py-6 h-full flex items-center justify-center">
            <ToggleVenueOpen />
          </div>
        </Suspense>
      }
      aside={null}
    />
  )
}

AdminHome.getLayout = (page) => <AdminLayout>{page}</AdminLayout>
AdminHome.suppressFirstRenderFlicker = true

export const getServerSideProps = gSSP(async (bag) => {
  const { locale, ctx } = bag
  const { session } = ctx
  const { venue } = session
  if (!venue) {
    return {
      redirect: {
        destination: Routes.RestaurantSignupPage(),
        permanent: false,
      },
    }
  }
  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  }
})

AdminHome.authenticate = {
  redirectTo: Routes.Authentication(),
}

export default AdminHome
