import { AuthenticatedSessionContext } from "@blitzjs/auth";
import { BlitzPage, Routes } from "@blitzjs/next";
import { Center, LoadingOverlay } from "@mantine/core";
import { Suspense } from "react";
import { ToggleVenueOpen } from "src/admin/components/ToggleVenueOpen";
import { gSSP } from "src/blitz-server";
import { AdminLayout } from "src/core/layouts/AdminLayout";

const AdminHome: BlitzPage = () => {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <Center className="h-96">
        <ToggleVenueOpen />
      </Center>
    </Suspense>
  );
};

AdminHome.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;
AdminHome.suppressFirstRenderFlicker = true;

export const getServerSideProps = gSSP(async (bag) => {
  const { locale, ctx } = bag;
  //  because we specify authenticate this is safe
  const session = ctx.session as AuthenticatedSessionContext;
  const { venue } = session;
  if (!venue) {
    return {
      redirect: {
        destination: Routes.Impersonate(),
        permanent: false,
      },
    };
  }
  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  };
});

AdminHome.authenticate = {
  redirectTo: Routes.Authentication(),
};

export default AdminHome;
