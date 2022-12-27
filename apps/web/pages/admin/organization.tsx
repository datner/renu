import { BlitzPage, Routes } from "@blitzjs/next"
import { Content } from "src/admin/components/Content"
import { gSSP } from "src/blitz-server"
import { AdminLayout } from "src/core/layouts/AdminLayout"

const AdminOrganization: BlitzPage = () => {
  return (
    <Content
      main={
        <div className="bg-white py-8 px-4 m-6 mx-8 shadow sm:rounded-lg sm:px-10">
          welcome to org
        </div>
      }
      aside={null}
    />
  )
}

AdminOrganization.authenticate = {
  redirectTo: Routes.Authentication(),
}

AdminOrganization.getLayout = (page) => <AdminLayout>{page}</AdminLayout>

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

export default AdminOrganization
