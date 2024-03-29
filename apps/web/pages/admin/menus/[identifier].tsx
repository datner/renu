import { BlitzPage, ErrorBoundary, Routes, useParam } from "@blitzjs/next";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { Aside } from "src/admin/components/Aside";
import { CategoryAdminPanel } from "src/admin/components/CategoryAdminPanel";
import { gSSP } from "src/blitz-server";
import { AdminLayout } from "src/core/layouts/AdminLayout";

const AdminMenusMenu: BlitzPage = () => {
  const identifier = useParam("identifier", "string");
  const router = useRouter();
  return (
    <ErrorBoundary
      onError={() => router.push(Routes.AdminMenus())}
      fallback={<div>oops! couldn&apos;t find a {identifier}</div>}
    >
      <div className="flex flex-col min-h-0 items-stretch grow justify-center p-6">
        {identifier && <CategoryAdminPanel identifier={identifier} />}
      </div>
    </ErrorBoundary>
  );
};

export const getServerSideProps = gSSP(async (ctx: GetServerSidePropsContext) => {
  const { locale, query } = ctx;
  const { identifier } = query;
  if (!identifier || Array.isArray(identifier)) {
    return {
      redirect: {
        destination: Routes.AdminItemsNew(),
        permanent: false,
      },
      props: {},
    };
  }

  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  };
});

AdminMenusMenu.authenticate = {
  redirectTo: Routes.Authentication(),
};

AdminMenusMenu.getLayout = (page) => <AdminLayout aside={<Aside.Categories />}>{page}</AdminLayout>;

export default AdminMenusMenu;
