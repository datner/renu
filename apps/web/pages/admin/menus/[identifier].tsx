import { gSSP } from "src/blitz-server"
import { GetServerSidePropsContext } from "next"
import { BlitzPage, ErrorBoundary, Routes, useParam } from "@blitzjs/next"
import { Content } from "src/admin/components/Content"
import { AdminLayout } from "src/core/layouts/AdminLayout"
import { Suspense } from "react"
import { Aside } from "src/admin/components/Aside"
import { LoadingOverlay } from "@mantine/core"
import { useRouter } from "next/router"
import { CategoryAdminPanel } from "src/admin/components/CategoryAdminPanel"

const AdminMenusMenu: BlitzPage = () => {
  const identifier = useParam("identifier", "string")
  const router = useRouter()
  return (
    <Content
      main={
        <ErrorBoundary
          onError={() => router.push(Routes.AdminMenus())}
          fallback={<div>oops! couldn&apos;t find a {identifier}</div>}
        >
          <Suspense fallback={<LoadingOverlay visible />}>
            <div className="flex flex-col min-h-0 items-stretch grow justify-center p-6">
              {identifier && <CategoryAdminPanel identifier={identifier} />}
            </div>
          </Suspense>
        </ErrorBoundary>
      }
      aside={
        <Suspense fallback={<LoadingOverlay visible />}>
          <Aside.Categories />
        </Suspense>
      }
    />
  )
}

export const getServerSideProps = gSSP(async (ctx: GetServerSidePropsContext) => {
  const { locale, query } = ctx
  const { identifier } = query
  if (!identifier || Array.isArray(identifier)) {
    return {
      redirect: {
        destination: Routes.AdminItemsNew(),
        permanent: false,
      },
      props: {},
    }
  }

  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  }
})

AdminMenusMenu.authenticate = {
  redirectTo: Routes.Authentication(),
}

AdminMenusMenu.getLayout = (page) => <AdminLayout>{page}</AdminLayout>

export default AdminMenusMenu
