import { BlitzPage } from "@blitzjs/next";
import { LoadingOverlay } from "@mantine/core";
import { Suspense } from "react";
import { Aside } from "src/admin/components/Aside";
import { Content } from "src/admin/components/Content";
import { CreateItemForm } from "src/admin/components/CreateItemForm";
import { gSSP } from "src/blitz-server";
import AdminItemsItem from "./[identifier]";

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

export const getServerSideProps = gSSP(async (ctx) => {
  const { locale } = ctx;

  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  };
});

export default AdminItemsNew;
