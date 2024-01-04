import "@mantine/dropzone/styles.css";
import { BlitzLayout, Routes } from "@blitzjs/next";
import NiceModal from "@ebay/nice-modal-react";
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ClipboardIcon,
  // CogIcon,
  // CircleStackIcon as CollectionIcon,
  HomeIcon,
  Square2StackIcon,
  // PhotoIcon as PhotographIcon,
  // UserGroupIcon,
} from "@heroicons/react/24/solid";
import { AppShell, LoadingOverlay } from "@mantine/core";
import clsx from "clsx";
import { ReactNode, Suspense } from "react";
import { ToastContainer } from "react-toastify";
import { ImpersonationNotice } from "src/auth/components/ImpersonationNotice";
import { useIsRtl } from "../hooks/useIsRtl";
import Layout from "./Layout";

import "react-toastify/dist/ReactToastify.css";
import { Header } from "src/admin/components/Content/Header";
import { ActiveLink } from "../components/ActiveLink";

type Props = { children?: ReactNode; aside?: ReactNode };

const sidebarNavigation = [
  { name: "Home", href: Routes.AdminHome(), icon: HomeIcon },
  { name: "Menus", href: Routes.AdminMenus(), icon: ClipboardIcon },
  { name: "Inventory", href: Routes.AdminItems(), icon: Square2StackIcon },
  { name: "Venue", href: Routes.AdminVenue(), icon: BuildingStorefrontIcon },
  {
    name: "Organization",
    href: Routes.AdminOrganization(),
    icon: BuildingOffice2Icon,
    disabled: true,
  },
  // { name: "Settings", href: "/admin/settings", icon: CogIcon, current: false },
];

const navLinks = sidebarNavigation.map((item) => (
  <ActiveLink key={item.name} href={item.href}>
    {({ active }) => (
      <a
        onClick={(e) => {
          if (item.disabled) e.preventDefault();
        }}
        className={clsx(
          active
            ? "bg-emerald-800 text-white"
            : item.disabled
            ? "text-emerald-600 cursor-not-allowed"
            : "text-emerald-100 hover:bg-emerald-800 hover:text-white",
          "group w-full p-3 rounded-md flex flex-col items-center text-xs font-medium",
        )}
        aria-current={active ? "page" : undefined}
      >
        <item.icon
          className={clsx(
            active
              ? "text-white"
              : item.disabled
              ? "text-emerald-600"
              : "text-emerald-300 group-hover:text-white",
            "h-6 w-6",
          )}
          aria-hidden="true"
        />
        <span className="mt-2">{item.name}</span>
      </a>
    )}
  </ActiveLink>
));

const navigation = (
  <AppShell.Navbar bg="teal">
    <AppShell.Section grow className="p-3 space-y-2">
      {navLinks}
    </AppShell.Section>
  </AppShell.Navbar>
);

export const AdminLayout: BlitzLayout<Props> = ({ children, aside }) => (
  <NiceModal.Provider>
    <Layout title="Renu | Admin">
      <AppShell
        header={{ height: 65 }}
        navbar={{ width: 112, breakpoint: 0 }}
        aside={{ width: 300, breakpoint: 0, collapsed: { desktop: !aside } }}
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>
        {navigation}
        <AppShell.Main className="bg-gray-50">
          <Suspense>
            <ImpersonationNotice />
          </Suspense>
          <Suspense fallback={<LoadingOverlay visible />}>
            {children}
          </Suspense>
        </AppShell.Main>
        {aside && (
          <AppShell.Aside>
            <Suspense fallback={<LoadingOverlay visible />}>
              {aside}
            </Suspense>
          </AppShell.Aside>
        )}
        <ToastContainer rtl={useIsRtl()} autoClose={1500} position="bottom-right" />
      </AppShell>
    </Layout>
  </NiceModal.Provider>
);
