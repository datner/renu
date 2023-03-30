import { useMutation } from "@blitzjs/rpc";
import { Menu } from "@headlessui/react";
import clsx from "clsx";
import logout from "src/auth/mutations/logout";

export const LogoutButton = () => {
  const [signout] = useMutation(logout);

  return (
    <Menu.Item key="logout">
      {({ active }) => (
        <button
          onClick={() => signout()}
          className={clsx(active && "bg-gray-100", "block w-full px-4 py-2 text-sm text-gray-700")}
        >
          Sign Out
        </button>
      )}
    </Menu.Item>
  );
};
