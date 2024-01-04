import { BlitzPage, ErrorBoundary, Routes, useParam } from "@blitzjs/next";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { Aside } from "src/admin/components/Aside";
import { UpdateItemForm } from "src/admin/components/UpdateItemForm";
import { gSSP } from "src/blitz-server";
import { AdminLayout } from "src/core/layouts/AdminLayout";

const AdminItemsItem: BlitzPage = () => {
  const identifier = useParam("identifier", "string");
  const router = useRouter();
  return (
    <ErrorBoundary
      onError={() => router.push(Routes.AdminItems())}
      fallback={<div>oops! couldn&apos;t find a {identifier}</div>}
    >
      <div className="flex flex-col min-h-0 items-stretch grow justify-center p-6">
        {identifier && <UpdateItemForm identifier={identifier} />}
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

AdminItemsItem.authenticate = {
  redirectTo: Routes.Authentication(),
};

AdminItemsItem.getLayout = (page) => <AdminLayout aside={<Aside.Directory />}>{page}</AdminLayout>;

export default AdminItemsItem;
