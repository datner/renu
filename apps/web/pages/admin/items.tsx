import { BlitzPage, Routes } from "@blitzjs/next";
import { gSSP } from "src/blitz-server";
import SpecificItem from "./items/[identifier]";

const AdminItems: BlitzPage = () => {
  return (
    <div className="bg-white py-8 px-4 m-6 mx-8 shadow sm:rounded-lg sm:px-10">
      pick an item :)
    </div>
  );
};

AdminItems.authenticate = SpecificItem.authenticate;

AdminItems.getLayout = SpecificItem.getLayout;

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

export default AdminItems;
