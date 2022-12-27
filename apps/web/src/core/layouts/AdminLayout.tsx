import { BlitzLayout, Routes } from "@blitzjs/next"
import clsx from "clsx"
import { ReactNode, Suspense } from "react"
import Layout from "./Layout"
import {
  Square2StackIcon,
  // CogIcon,
  // CircleStackIcon as CollectionIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ClipboardIcon,
  BuildingOffice2Icon,
  // PhotoIcon as PhotographIcon,
  // UserGroupIcon,
} from "@heroicons/react/24/solid"
import { ImpersonationNotice } from "src/auth/components/ImpersonationNotice"
import { ToastContainer } from "react-toastify"
import NiceModal from "@ebay/nice-modal-react"
import { useIsRtl } from "../hooks/useIsRtl"
import { Navbar } from "@mantine/core"

import "react-toastify/dist/ReactToastify.css"
import { ActiveLink } from "../components/ActiveLink"

type Props = { children?: ReactNode }

const sidebarNavigation = [
  { name: "Home", href: Routes.AdminHome(), icon: HomeIcon },
  { name: "Menus", href: Routes.AdminMenus(), icon: ClipboardIcon, disabled: true },
  { name: "Inventory", href: Routes.AdminItems(), icon: Square2StackIcon },
  { name: "Venue", href: Routes.AdminVenue(), icon: BuildingStorefrontIcon },
  {
    name: "Organization",
    href: Routes.AdminOrganization(),
    icon: BuildingOffice2Icon,
    disabled: true,
  },
  // { name: "Settings", href: "/admin/settings", icon: CogIcon, current: false },
]

const navLinks = sidebarNavigation.map((item) => (
  <ActiveLink key={item.name} href={item.href}>
    {({ active }) => (
      <a
        onClick={(e) => {
          if (item.disabled) e.preventDefault()
        }}
        className={clsx(
          active
            ? "bg-emerald-800 text-white"
            : item.disabled
            ? "text-emerald-600 cursor-not-allowed"
            : "text-emerald-100 hover:bg-emerald-800 hover:text-white",

          "group w-full p-3 rounded-md flex flex-col items-center text-xs font-medium"
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
            "h-6 w-6"
          )}
          aria-hidden="true"
        />
        <span className="mt-2">{item.name}</span>
      </a>
    )}
  </ActiveLink>
))

const navigation = (
  <Navbar
    sx={(theme) => ({ backgroundColor: theme.colors.teal[7], border: 0 })}
    width={{ sm: 112 }}
  >
    <Navbar.Section>
      <div className="h-16"></div>
    </Navbar.Section>
    <Navbar.Section grow className="p-3 space-y-2">
      {navLinks}
    </Navbar.Section>
  </Navbar>
)

export const AdminLayout: BlitzLayout<Props> = ({ children }) => (
  <Layout title="Renu | Admin">
    <div className="flex grow min-h-0">
      {navigation}
      <div className="grow min-h-0 flex flex-col">
        <Suspense>
          <ImpersonationNotice />
        </Suspense>
        <NiceModal.Provider>
          {children}
          <ToastContainer rtl={useIsRtl()} autoClose={1500} position="bottom-right" />
        </NiceModal.Provider>
      </div>
    </div>
  </Layout>
)
