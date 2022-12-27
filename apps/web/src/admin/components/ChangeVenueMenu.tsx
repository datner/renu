import { useAuthenticatedSession } from "@blitzjs/auth"
import { useQuery, useMutation, getQueryClient } from "@blitzjs/rpc"
import { titleFor } from "src/core/helpers/content"
import { useLocale } from "src/core/hooks/useLocale"
import changeCurrentVenue from "src/venues/mutations/changeCurrentVenue"
import getOrgVenues from "src/venues/queries/getOrgVenues"
import { pipe } from "fp-ts/function"
import * as RA from "fp-ts/ReadonlyArray"
import * as O from "fp-ts/Option"
import { RestaurantI18L, Venue } from "@prisma/client"
import { Menu, Transition } from "@headlessui/react"
import { clsx, Loader } from "@mantine/core"
import { ChevronDownIcon } from "@heroicons/react/24/solid"
import { Fragment } from "react"

export const ChangeVenueMenu = () => {
  const [venues] = useQuery(getOrgVenues, {})
  const { venue } = useAuthenticatedSession()
  const [changeVenue, { isLoading }] = useMutation(changeCurrentVenue, {
    onSuccess() {
      getQueryClient().clear()
    },
  })
  const title = titleFor(useLocale())

  const currentVenue = pipe(
    O.fromNullable(venue),
    O.chain(({ id }) =>
      pipe(
        venues,
        RA.findFirst<Venue & { content: RestaurantI18L[] }>((venue) => venue.id === id)
      )
    )
  )

  const currentTitle = pipe(
    currentVenue,
    O.match(() => "unknown venue", title)
  )
  return (
    <Menu as="div" className="relative shrink-0">
      <div>
        <Menu.Button className="bg-white rounded-sm flex rtl:flex-row-reverse px-3 py-1.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
          {isLoading ? <Loader className="mt-1.5" variant="dots" /> : currentTitle}
          <ChevronDownIcon
            className="ml-2 -mr-1 h-5 w-5 text-emerald-200 hover:text-emerald-100"
            aria-hidden="true"
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
        <Menu.Items
          static
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          {pipe(
            venues,
            RA.match(
              () => [
                <Menu.Item
                  key="loading"
                  as="button"
                  className="block w-full px-4 py-2 text-sm text-gray-700 text-left rtl:text-right"
                >
                  loading...
                </Menu.Item>,
              ],
              RA.map((venue) => (
                <Menu.Item key={venue.identifier}>
                  {({ active }) => (
                    <button
                      onClick={() => changeVenue(venue.id)}
                      className={clsx(
                        active && "bg-gray-100",
                        "block w-full px-4 py-2 text-sm text-gray-700 text-left rtl:text-right"
                      )}
                    >
                      {title(venue)}
                    </button>
                  )}
                </Menu.Item>
              ))
            )
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
