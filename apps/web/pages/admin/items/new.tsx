import { AuthenticatedSessionContext } from "@blitzjs/auth";
import { BlitzPage, Routes } from "@blitzjs/next";
import { CreateItemForm } from "src/admin/components/CreateItemForm";
import { gSSP } from "src/blitz-server";
import AdminItemsItem from "./[identifier]";

const AdminItemsNew: BlitzPage = () => {
  return (
    <div className="p-4">
      <CreateItemForm />
    </div>
  );
};

AdminItemsNew.authenticate = AdminItemsItem.authenticate;

AdminItemsNew.getLayout = AdminItemsItem.getLayout;

export const getServerSideProps = gSSP(async (context) => {
  const { locale, ctx } = context;

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
