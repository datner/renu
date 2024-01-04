import { BlitzPage, Routes } from "@blitzjs/next";
import { Aside } from "src/admin/components/Aside";
import { gSSP } from "src/blitz-server";
import { AdminLayout } from "src/core/layouts/AdminLayout";

const AdminMenus: BlitzPage = () => {
  return (
    <div className="bg-white py-8 px-4 m-6 mx-8 shadow sm:rounded-lg sm:px-10">
      pick a category
    </div>
  );
};

AdminMenus.authenticate = {
  redirectTo: Routes.Authentication(),
};

AdminMenus.getLayout = (page) => <AdminLayout aside={<Aside.Categories />}>{page}</AdminLayout>;

export const getServerSideProps = gSSP(async (bag) => {
  const { locale, ctx } = bag;
  const { session } = ctx;
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

export default AdminMenus;
