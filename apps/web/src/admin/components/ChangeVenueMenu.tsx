import { useAuthenticatedSession } from "@blitzjs/auth";
import { getQueryClient, useMutation, useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as RA from "@effect/data/ReadonlyArray";
import * as Schema from "@effect/schema/Schema";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { clsx, Loader } from "@mantine/core";
import { Fragment } from "react";
import { Content } from "shared/schema/common";
import { titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import changeCurrentVenue from "src/venues/mutations/changeCurrentVenue";
import getOrgVenues from "src/venues/queries/getOrgVenues";

const VenueContent = pipe(Content, Schema.omit("description"), Schema.array);
interface VenueContent extends Schema.To<typeof VenueContent> {}

const decodeContent = Schema.decodeSync(VenueContent);

export const ChangeVenueMenu = () => {
  const [venues] = useQuery(getOrgVenues, {});
  const { venue } = useAuthenticatedSession();
  const [changeVenue, { isLoading }] = useMutation(changeCurrentVenue, {
    onSuccess() {
      getQueryClient().clear();
      fetch("/api/revalidate-current");
    },
  });
  const locale = useLocale();
  const title = (content: VenueContent) =>
    pipe(
      decodeContent(content),
      RA.findFirst(_ => _.locale === locale),
      O.map(_ => _.name),
    );

  const currentVenue = pipe(
    O.fromNullable(venue),
    O.flatMap(({ id }) => RA.findFirst(venues, (venue) => venue.id === id)),
  );

  const currentTitle = pipe(
    currentVenue,
    O.map(_ => _.content),
    O.flatMap(title),
    O.getOrElse(() => "unknown venue"),
  );

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
            RA.match({
              onEmpty: () => [
                <Menu.Item
                  key="loading"
                  as="button"
                  className="block w-full px-4 py-2 text-sm text-gray-700 text-left rtl:text-right"
                >
                  loading...
                </Menu.Item>,
              ],
              onNonEmpty: RA.map((venue) => (
                <Menu.Item key={venue.identifier}>
                  {({ active }) => (
                    <button
                      onClick={() => changeVenue(venue.id)}
                      className={clsx(
                        active && "bg-gray-100",
                        "block w-full px-4 py-2 text-sm text-gray-700 text-left rtl:text-right",
                      )}
                    >
                      {O.getOrElse(title(venue.content), () => "unknown venue")}
                    </button>
                  )}
                </Menu.Item>
              )),
            }),
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
