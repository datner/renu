import Link from "next/link"
import Image from "next/image"
import { Routes } from "@blitzjs/next"
import { useQuery } from "@blitzjs/rpc"
import { priceShekel, titleFor } from "src/core/helpers/content"
import { useLocale } from "src/core/hooks/useLocale"
import { useTranslations } from "next-intl"
import getCurrentVenueCategories from "src/categories/queries/getCurrentVenueCategories"
import { Loader, LoadingOverlay } from "@mantine/core"

function AsideDirectory() {
  const locale = useLocale()
  const t = useTranslations("admin.Components.Aside")
  const [queryBag, { isLoading, isRefetching }] = useQuery(getCurrentVenueCategories, {})
  const { categories } = queryBag

  const title = titleFor(locale)

  return (
    <div className="flex min-h-0 grow flex-col">
      <LoadingOverlay visible={isLoading} />
      <div className="p-2 pl-4 flex items-center">
        <h3 className="text-xl text-gray-800 font-semibold inline-block grow">{t("items")}</h3>
        {isRefetching && <Loader color="teal" variant="dots" />}
      </div>
      <nav className="grow min-h-0 overflow-y-auto" aria-label="Directory">
        {categories.map(({ categoryItems: items, identifier, ...rest }) => (
          <div key={identifier} className="relative">
            <div className="z-10 sticky top-0 border-t border-b border-gray-200 bg-gray-50 px-6 py-1 text-sm font-medium text-gray-500">
              <h3>{title(rest)}</h3>
            </div>
            <ul role="list" className="relative z-0 divide-y divide-gray-200">
              {items.map(({ Item: item }) => (
                <li key={item.id} className="bg-white">
                  <div className="relative px-6 py-5 flex items-center gap-3 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500">
                    <div className="flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.identifier}
                          className="h-10 w-10 rounded-full object-cover"
                          height={40}
                          width={40}
                          placeholder={item.blurDataUrl ? "blur" : "empty"}
                          blurDataURL={item.blurDataUrl ?? undefined}
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
                        <p className="text-sm font-medium text-gray-900">{title(item)}</p>
                        <p className="text-sm text-gray-500 truncate">{priceShekel(item)}</p>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

export const Aside = { Directory: AsideDirectory }
