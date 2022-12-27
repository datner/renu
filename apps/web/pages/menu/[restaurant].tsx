import { gSP } from "src/blitz-server"
import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType } from "next"
import clsx from "clsx"
import db, { Locale, Prisma } from "db"
import { Suspense, useState } from "react"
import { useLocale } from "src/core/hooks/useLocale"
import { contentOption, titleFor } from "src/core/helpers/content"
import { ListItem } from "src/menu/components/ListItem"
import { CategoryHeader } from "src/menu/components/CategoryHeader"
import { useNavBar } from "src/menu/hooks/useNavBar"
import { fromNullable, getEq, some, matchW } from "fp-ts/Option"
import { Eq as eqStr } from "fp-ts/string"
import { constNull } from "fp-ts/function"
import { NotFoundError } from "blitz"
import dynamic from "next/dynamic"
import { Query } from "src/menu/validations/page"
import Head from "next/head"
import { BlitzPage } from "@blitzjs/auth"
import MenuLayout from "src/core/layouts/MenuLayout"
import { OrderItem, orderAtomFamily } from "src/menu/jotai/order"
import { useAtom } from "jotai"
import { itemAtom, itemModalOpenAtom } from "src/menu/jotai/item"
import { ModifierConfig } from "db/itemModifierConfig"
import { Closed } from "src/menu/components/Closed"

const LazyViewOrderButton = dynamic(() => import("src/menu/components/ViewOrderButton"), {
  suspense: true,
})
const LazyItemModal = dynamic(() => import("src/menu/components/ItemModal"), { suspense: true })
const LazyOrderModal = dynamic(() => import("src/menu/components/OrderModal"), { suspense: true })

const eqOptionStr = getEq(eqStr)

export const Menu: BlitzPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  const { restaurant } = props
  const { categories } = restaurant
  const navbar = useNavBar({ initialActive: fromNullable(categories[0]?.identifier) })
  // const { table } = useZodParams(Query)
  const locale = useLocale()
  const [item, setItem] = useAtom(itemAtom)
  const [open, setOpen] = useAtom(itemModalOpenAtom)
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
        ref={navbar.setContainer}
        onScroll={navbar.onScroll}
        className={clsx(
          "relative flex flex-col grow min-h-0 bg-gray-50 scroll-smooth",
          open || reviewOrder ? "overflow-hidden" : "overflow-auto"
        )}
      >
        <nav
          aria-label="Categories"
          className="sticky top-0 z-20 flex min-h-0 shrink-0 w-full overflow-x-auto bg-white shadow snap-x snap-mandatory scroll-smooth gap-2 p-2 "
        >
          {categories?.map((it, index) => (
            <button
              key={it.id}
              ref={navbar.setButton(String(it.id))}
              onClick={navbar.onClick(index)}
              className={clsx(
                eqOptionStr.equals(some(it.identifier), navbar.section)
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400"
                  : "border-transparent text-gray-500 hover:text-gray-700",
                "block flex-shrink-0 rounded-md snap-start scroll-m-2 px-3 py-2 text-sm font-medium"
              )}
            >
              {getTitle(it)}
            </button>
          ))}
        </nav>
        <div className="space-y-8">
          {categories?.map((category) => (
            <div key={category.id} className="group ">
              <CategoryHeader ref={navbar.setSection} category={category} />
              <ul role="list" className="flex flex-col gap-2 group-last:min-h-screen">
                {category.items?.map((item) => (
                  <ListItem
                    key={item.id}
                    atom={orderAtomFamily(item)}
                    onClick={() => handleShowOrderModal(item)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Suspense fallback={<></>}>
          <LazyViewOrderButton
            onClick={() => {
              setReviewOrder(true)
            }}
          />
        </Suspense>
        <Suspense fallback={<></>}>
          <LazyOrderModal open={reviewOrder} onClose={() => setReviewOrder(false)} />
        </Suspense>
        <Suspense fallback={<></>}>{itemModal(item)}</Suspense>
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
    revalidate: 60,
  }
})
