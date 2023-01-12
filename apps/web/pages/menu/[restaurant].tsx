import { gSP } from "src/blitz-server"
import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType } from "next"
import clsx from "clsx"
import db, { Locale, Prisma } from "db"
import { Fragment, useState } from "react"
import { useLocale } from "src/core/hooks/useLocale"
import { contentOption, titleFor } from "src/core/helpers/content"
import { CategoryHeader } from "src/menu/components/CategoryHeader"
import { useNavBar } from "src/menu/hooks/useNavBar"
import { matchW } from "fp-ts/Option"
import { constNull } from "fp-ts/function"
import { NotFoundError } from "blitz"
import dynamic from "next/dynamic"
import { Query } from "src/menu/validations/page"
import Head from "next/head"
import { BlitzPage } from "@blitzjs/auth"
import MenuLayout from "src/core/layouts/MenuLayout"
import { OrderItem, orderAtomFamily } from "src/menu/jotai/order"
import { useAtom, useSetAtom } from "jotai"
import { itemAtom, itemModalOpenAtom } from "src/menu/jotai/item"
import { ModifierConfig } from "db/itemModifierConfig"
import { Closed } from "src/menu/components/Closed"
import { ListItem } from "src/menu/components/ListItem"

const LazyViewOrderButton = dynamic(() => import("src/menu/components/ViewOrderButton"), {
  suspense: true,
})
const LazyItemModal = dynamic(() => import("src/menu/components/ItemModal"), {
  loading: () => <Fragment />,
})
const LazyOrderModal = dynamic(() => import("src/menu/components/OrderModal"), {
  loading: () => <Fragment />,
})

export const Menu: BlitzPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  const { restaurant } = props
  const { categories } = restaurant
  const { attachNav, setRoot, observe, active, setActive } = useNavBar()
  const locale = useLocale()
  const [item, setItem] = useAtom(itemAtom)
  const setOpen = useSetAtom(itemModalOpenAtom)
  const [reviewOrder, setReviewOrder] = useState(false)

  const handleShowOrderModal = (item: OrderItem["item"]) => {
    setItem(item)
    setOpen(true)
  }

  const getTitle = titleFor(locale)

  const itemModal = matchW<null, OrderItem["item"], JSX.Element>(constNull, (item) => (
    <LazyItemModal atom={orderAtomFamily(item)} />
  ))

  if (!restaurant.open) {
    return (
      <>
        <Head>
          <title>{getTitle(restaurant) + " | Renu"}</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Closed venue={contentOption("name", locale)(restaurant)} />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{getTitle(restaurant) + " | Renu"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        ref={setRoot}
        className="flex flex-col grow min-h-0 bg-gray-50 scroll-smooth overflow-x-hidden"
      >
        <div
          role="tablist"
          aria-label="Categories"
          className="fixed top-0 z-20 flex min-h-0 shrink-0 inset-x-0 overflow-x-auto bg-white shadow snap-x snap-mandatory scroll-smooth gap-2 p-2 scroll-m-2"
        >
          {categories?.map((it) => (
            <button
              key={it.id}
              ref={attachNav}
              aria-label={it.identifier}
              onClick={() => setActive(document.querySelector(`#${it.identifier}`))}
              className={clsx(
                active?.id === it.identifier
                  ? [
                      "ring-1",
                      "5nth-1:bg-emerald-100 5nth-1:text-emerald-700 5nth-1:ring-emerald-400",
                      "5nth-2:bg-ocre-100 5nth-2:text-ocre-700 5nth-2:ring-ocre-400",
                      "5nth-3:bg-ginger-100 5nth-3:text-ginger-700 5nth-3:ring-ginger-400",
                      "5nth-4:bg-coral-100 5nth-4:text-coral-700 5nth-4:ring-coral-400",
                      "5nth-5:bg-blush-100 5nth-5:text-blush-700 5nth-5:ring-blush-400",
                    ]
                  : "border-transparent text-gray-500 hover:text-gray-700",
                "block flex-shrink-0 rounded-md snap-start px-3 py-2 text-sm font-semibold scroll-m-2"
              )}
            >
              {getTitle(it)}
            </button>
          ))}
        </div>
        <div>
          {categories?.map((category) => (
            <div
              id={category.identifier}
              aria-current={active?.id === category.identifier && "location"}
              ref={observe}
              key={category.id}
              className={clsx("group pt-14", [
                "5nth-1:bg-emerald-100",
                "5nth-2:bg-ocre-100",
                "5nth-3:bg-ginger-100",
                "5nth-4:bg-coral-100",
                "5nth-5:bg-blush-100",
              ])}
            >
              <CategoryHeader category={category} />
              <ul role="list" className="flex flex-col gap-2 pb-2 group-last:min-h-screen">
                {category.items?.map((item) => (
                  <ListItem
                    key={item.id}
                    atom={orderAtomFamily(item)}
                    onClick={() => handleShowOrderModal(item)}
                  />
                ))}
              </ul>
              <div
                className={clsx("h-16 bg-gradient-to-b", [
                  "group-5nth-1:from-emerald-100 group-5nth-1:to-ocre-100",
                  "group-5nth-2:from-ocre-100 group-5nth-2:to-ginger-100",
                  "group-5nth-3:from-ginger-100 group-5nth-3:to-coral-100",
                  "group-5nth-4:from-coral-100 group-5nth-4:to-blush-100",
                  "group-5nth-5:from-blush-100 group-5nth-5:to-emerald-100",
                  "group-last:group-last:to-gray-50",
                ])}
              />
            </div>
          ))}
        </div>
        <LazyViewOrderButton
          onClick={() => {
            setReviewOrder(true)
          }}
        />
        <LazyOrderModal open={reviewOrder} onClose={() => setReviewOrder(false)} />
        {itemModal(item)}
        {restaurant.simpleContactInfo && (
          <div className="mt-4 text-center">{restaurant.simpleContactInfo}</div>
        )}
        <div className="mt-4 text-center">
          ביטול עסקה בהתאם לתקנות הגנת הצרכן (ביטול עסקה), התשע״א-2010 וחוק הגנת הצרכן, התשמ״א-1981
        </div>
      </div>
    </>
  )
}

Menu.getLayout = (comp) => <MenuLayout>{comp}</MenuLayout>

export default Menu

export const getStaticPaths: GetStaticPaths = async () => {
  const venues = await db.venue.findMany()

  const locales = Object.values(Locale)
  return {
    fallback: "blocking",
    paths: locales.flatMap((locale) =>
      venues.map((it) => ({ params: { restaurant: it.identifier }, locale }))
    ),
  }
}

export const getStaticProps = gSP(async (context: GetStaticPropsContext) => {
  const { restaurant: identifier } = Query.parse(context.params)
  const restaurant = await db.venue.findUnique({
    where: { identifier },
    select: {
      open: true,
      simpleContactInfo: true,
      content: {
        select: {
          locale: true,
          name: true,
        },
      },
      categories: {
        where: { categoryItems: { some: { Item: { deleted: null } } } },
        select: {
          id: true,
          identifier: true,
          content: {
            select: {
              locale: true,
              name: true,
              description: true,
            },
          },
          categoryItems: {
            orderBy: { position: Prisma.SortOrder.asc },
            where: {
              Item: { deleted: null },
            },
            select: {
              position: true,
              Item: {
                select: {
                  id: true,
                  image: true,
                  price: true,
                  identifier: true,
                  blurDataUrl: true,
                  categoryId: true,
                  content: {
                    select: {
                      locale: true,
                      name: true,
                      description: true,
                    },
                  },
                  modifiers: {
                    orderBy: { position: Prisma.SortOrder.asc },
                    select: {
                      id: true,
                      position: true,
                      config: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!restaurant) throw new NotFoundError()

  const typedRestaurant = {
    ...restaurant,
    categories: restaurant.categories.map((c) => ({
      ...c,
      items: c.categoryItems.map(({ Item: i }) => ({
        ...i,
        modifiers: i.modifiers
          .map((m) => ({
            ...m,
            config: ModifierConfig.parse(m.config),
          }))
          .sort((a, b) => a.position - b.position),
      })),
    })),
  }

  return {
    props: {
      restaurant: typedRestaurant,
      messages: (await import(`src/core/messages/${context.locale}.json`)).default,
    },
  }
})
