import { BlitzPage, Routes } from "@blitzjs/next";
import { VenueSettings } from "src/admin/components/VenueSettings";
import { gSSP } from "src/blitz-server";
import { AdminLayout } from "src/core/layouts/AdminLayout";

const AdminVenue: BlitzPage = () => {
  return <VenueSettings />;
};

AdminVenue.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;
AdminVenue.suppressFirstRenderFlicker = true;

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

AdminVenue.authenticate = {
  redirectTo: Routes.Authentication(),
};

export default AdminVenue;
