import { Routes } from "@blitzjs/next";
import { useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import { Loader, LoadingOverlay } from "@mantine/core";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Blurhash } from "react-blurhash";
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories";
import { priceShekel, titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import getCurrentVenueItems from "src/items/queries/current/getVenueItems";

function AsideDirectory() {
  const locale = useLocale();
  const t = useTranslations("admin.Components.Aside");
  const [items, { isLoading, isRefetching }] = useQuery(getCurrentVenueItems, undefined);

  const title = titleFor(locale);

  return (
    <div className="flex min-h-0 grow flex-col">
      <LoadingOverlay visible={isLoading} />
      <div className="p-2 pl-4 flex items-center border-b">
        <h3 className="text-xl text-gray-800 font-semibold inline-block grow">{t("items")}</h3>
        {isRefetching && <Loader color="teal" variant="dots" />}
      </div>
      <nav className="grow h-0 overflow-y-auto" aria-label="Directory">
        <ul role="list" className="relative z-0 divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="bg-white">
              <div className="relative px-5 py-5 flex items-center gap-4 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500">
                <div className="flex-shrink-0 relative w-10 h-10 rounded-full overflow-hidden">
                  { pipe(
                    Option.map(item.blurHash, hash => <Blurhash hash={hash} width={40} height={40} />),
                    Option.getOrNull,
                  )}
                  { item.image && (
                    <Image
                      src={item.image}
                      alt={item.identifier}
                      style={{ objectFit: "cover", aspectRatio: 1, position: "absolute", inset: 0 }}
                      width={40}
                      height={40}
                      placeholder={Option.match(item.blurDataUrl, () => "empty", () => "blur")}
                      blurDataURL={Option.getOrUndefined(item.blurDataUrl)}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    shallow
                    href={Routes.AdminItemsItem({ identifier: item.identifier })}
                    className="focus:outline-none"
                  >
                    {/* Extend touch target to entire panel */}
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">{title(item.content)}</p>
                    <p className="text-sm text-gray-500 truncate">{priceShekel(item)}</p>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function AsideCategories() {
  const locale = useLocale();
  const t = useTranslations("admin.Components.Aside");
  const [queryBag, { isLoading, isRefetching }] = useQuery(getCurrentVenueCategories, {});
  const { categories } = queryBag;

  const title = titleFor(locale);

  return (
    <div className="flex min-h-0 grow flex-col">
      <LoadingOverlay visible={isLoading} />
      <div className="p-2 pl-4 flex items-center border-b">
        <h3 className="text-xl text-gray-800 font-semibold inline-block grow">{t("categories")}</h3>
        {isRefetching && <Loader color="teal" variant="dots" />}
      </div>
      <nav className="grow h-0 overflow-y-auto" aria-label="Directory">
        <ul role="list" className="relative z-0 divide-y divide-gray-200">
          {categories.map(({ categoryItems: items, identifier, ...rest }, i) => (
            <li key={identifier + i} className="bg-white">
              <div className="relative px-6 py-5 flex items-center gap-3 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500">
                <Link
                  shallow
                  href={Routes.AdminMenusMenu({ identifier })}
                  className="focus:outline-none"
                >
                  {/* Extend touch target to entire panel */}
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{title(rest.content as any)}</p>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export const Aside = { Directory: AsideDirectory, Categories: AsideCategories };
