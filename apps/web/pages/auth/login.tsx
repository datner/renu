import { BlitzPage, Routes } from "@blitzjs/next";
import { useRouter } from "next/router";
import { LoginForm } from "src/auth/components/LoginForm";
import Layout from "src/core/layouts/Layout";

const LoginPage: BlitzPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-full flex grow bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm
          onSuccess={() => {
            const next = router.query.next
              ? decodeURIComponent(router.query.next as string)
              : Routes.AdminHome();

            router.push(next);
          }}
        />
      </div>
    </div>
  );
};

LoginPage.redirectAuthenticatedTo = Routes.AdminHome();
LoginPage.getLayout = (page) => <Layout title="Log In">{page}</Layout>;

export default LoginPage;
