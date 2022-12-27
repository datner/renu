import { gSSP } from "src/blitz-server"
import { BlitzPage, Routes } from "@blitzjs/next"
import { AdminLayout } from "src/core/layouts/AdminLayout"
import { Suspense } from "react"
import { Content } from "src/admin/components/Content"
import { LoadingOverlay } from "@mantine/core"
import * as O from "fp-ts/lib/Option"
import { VenueSettings } from "src/admin/components/VenueSettings"

const AdminVenue: BlitzPage = () => {
  return (
    <Content
      main={
        <Suspense fallback={<LoadingOverlay visible />}>
          <VenueSettings />
        </Suspense>
      }
      aside={null}
    />
  )
}

AdminVenue.getLayout = (page) => <AdminLayout>{page}</AdminLayout>
AdminVenue.suppressFirstRenderFlicker = true

export const getServerSideProps = gSSP(async (bag) => {
  const { locale, ctx } = bag
  const { session } = ctx
  const { venue = O.none } = session
  if (venue) {
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

AdminVenue.authenticate = {
  redirectTo: Routes.Authentication(),
}

export default AdminVenue
