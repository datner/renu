import { BlitzPage, Routes } from "@blitzjs/next";
import { LoadingOverlay } from "@mantine/core";
import { Suspense } from "react";
import { Aside } from "src/admin/components/Aside";
import { Content } from "src/admin/components/Content";
import { gSSP } from "src/blitz-server";
import AdminMenusMenu from "./[identifier]";
import { AuthenticatedSessionContext } from "@blitzjs/auth";

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
  );
};

AdminMenusNew.authenticate = AdminMenusMenu.authenticate;

AdminMenusNew.getLayout = AdminMenusMenu.getLayout;

export const getServerSideProps = gSSP(async (context) => {
  const { locale, ctx} = context;

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

export default AdminMenusNew;
