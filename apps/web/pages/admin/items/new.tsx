import { BlitzPage, Routes } from "@blitzjs/next";
import { LoadingOverlay } from "@mantine/core";
import { Suspense } from "react";
import { Aside } from "src/admin/components/Aside";
import { Content } from "src/admin/components/Content";
import { CreateItemForm } from "src/admin/components/CreateItemForm";
import { gSSP } from "src/blitz-server";
import AdminItemsItem from "./[identifier]";
import { AuthenticatedSessionContext } from "@blitzjs/auth";

const AdminItemsNew: BlitzPage = () => {
  return (
    <Content
      main={
        <Suspense fallback={<LoadingOverlay visible />}>
          <div className="px-8 pt-6 mx-auto flex max-w-4xl">
            <CreateItemForm />
          </div>
        </Suspense>
      }
      aside={
        <Suspense fallback={<LoadingOverlay visible />}>
          <Aside.Directory />
        </Suspense>
      }
    />
  );
};

AdminItemsNew.authenticate = AdminItemsItem.authenticate;

AdminItemsNew.getLayout = AdminItemsItem.getLayout;

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

export default AdminItemsNew;
