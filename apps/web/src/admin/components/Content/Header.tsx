import {
  ChevronDownIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PlusSmallIcon,
} from "@heroicons/react/24/solid"
import { Menu } from "@headlessui/react"
import { useLocale } from "src/core/hooks/useLocale"
import { useRouter } from "next/router"
import { Fragment, Suspense } from "react"
import { ChangeVenueMenu } from "src/admin/components/ChangeVenueMenu"
import { Transition } from "@headlessui/react"
import { LogoutButton } from "src/admin/components/LogoutButton"
import Link from "next/link"
import { Routes } from "@blitzjs/next"
import Image from "next/image"

export function Header() {
  const router = useRouter()
  const locale = useLocale()
  return (
    <header className="w-full">
      <div className="relative z-20 flex-shrink-0 h-16 bg-white border-b border-gray-200 shadow-sm flex">
        <div className="flex-1 flex justify-between px-4 sm:px-6">
          <div className="flex-1 flex">
            <form className="w-full flex md:ml-0" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search all files
              </label>
              <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                  <MagnifyingGlassIcon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  name="search-field"
                  id="search-field"
                  className="h-full w-full border-transparent py-2 pl-8 pr-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent focus:placeholder-gray-400"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </form>
          </div>
          <div className="ltr:ml-2 rtl:mr-2 flex items-center gap-4 sm:ltr:ml-6 sm:rtl:mr-6 sm:gap-6">
            <Suspense
              fallback={
                <Menu as="div" className="relative shrink-0">
                  <div>
                    <Menu.Button
                      disabled
                      className="bg-white rounded-sm flex rtl:flex-row-reverse px-3 py-1.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Loading...
                      <ChevronDownIcon
                        className="ml-2 -mr-1 h-5 w-5 text-emerald-200 hover:text-emerald-100"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                  </div>
                </Menu>
              }
            >
              <ChangeVenueMenu />
            </Suspense>
            {/* Profile dropdown */}
            <Menu as="div" className="relative shrink-0">
              <div>
                <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                  <span className="sr-only">Open user menu</span>
                  <Image
                    loader={({ src }) => src}
                    className="h-8 w-8 rounded-full"
                    unoptimized
                    width={32}
                    height={32}
                    src="https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80"
                    alt=""
                  />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <LogoutButton />
                </Menu.Items>
              </Transition>
            </Menu>

            <Link
              href={Routes.AdminItemsNew()}
              className="flex shrink-0 bg-emerald-600 p-1 rounded-full items-center justify-center text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <PlusSmallIcon className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Add Item</span>
            </Link>
            <Link
              href={router.asPath}
              locale={locale === "en" ? "he" : "en"}
              className="flex shrink-0 bg-emerald-600 p-1 rounded-full items-center justify-center text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <GlobeAltIcon className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">change locale</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
