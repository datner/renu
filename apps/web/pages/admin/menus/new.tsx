import { BlitzPage } from "@blitzjs/next"
import AdminMenusMenu from "./[identifier]"
import { Aside } from "src/admin/components/Aside"
import { Content } from "src/admin/components/Content"
import { Suspense } from "react"
import { LoadingOverlay } from "@mantine/core"
import { gSSP } from "src/blitz-server"

const AdminMenusNew: BlitzPage = () => {
  return (
    <Content
      main={
        <Suspense fallback={<LoadingOverlay visible />}>
          <div className="flex flex-col min-h-0 items-stretch grow justify-center p-6">nope</div>
        </Suspense>
      }
      aside={
        <Suspense fallback={<LoadingOverlay visible />}>
          <Aside.Categories />
        </Suspense>
      }
    />
  )
}

AdminMenusNew.authenticate = AdminMenusMenu.authenticate

AdminMenusNew.getLayout = AdminMenusMenu.getLayout

export const getServerSideProps = gSSP(async (ctx) => {
  const { locale } = ctx

  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  }
})

export default AdminMenusNew
