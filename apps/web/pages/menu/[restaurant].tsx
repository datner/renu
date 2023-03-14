import { gSP } from "src/blitz-server"
import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType } from "next"
import clsx from "clsx"
import db, { Locale } from "db"
import { Fragment, useMemo, useState } from "react"
import { useLocale } from "src/core/hooks/useLocale"
import { contentOption, titleFor } from "src/core/helpers/content"
import { CategoryHeader } from "src/menu/components/CategoryHeader"
import { useNavBar } from "src/menu/hooks/useNavBar"
import { NotFoundError } from "blitz"
import dynamic from "next/dynamic"
import { Query } from "src/menu/validations/page"
import Head from "next/head"
import { BlitzPage } from "@blitzjs/auth"
import MenuLayout from "src/core/layouts/MenuLayout"
import { Closed } from "src/menu/components/Closed"
import { ListItem } from "src/menu/components/ListItem"
import * as Order from "src/menu/hooks/useOrder"
import { selectTheEntireMenu } from "src/menu/prisma"
import * as A from "@effect/data/ReadonlyArray"
import * as HashMap from "@effect/data/HashMap"
import * as Data from "@effect/data/Data"
import { pipe } from "@effect/data/Function"
import * as Parser from "@effect/schema/Parser"
import * as _Menu from "src/menu/schema"

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
  const restaurant = useMemo(
    () => Parser.decodeOrThrow(_Menu.FullMenu)(props.restaurant),
    [props.restaurant]
  )

  const { categories } = restaurant
  const { attachNav, setRoot, observe, active, setActive } = useNavBar()
  // add the item modal state to the dispatch as well, just for laughs
  const [orderState, dispatch] = Order.useOrder()
  const locale = useLocale()
  const [reviewOrder, setReviewOrder] = useState(false)

  const getTitle = titleFor(locale)

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

  const orderItems = Order.getOrderItems(orderState.order)

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
                {category.categoryItems?.map(({ Item: item }) => {
                  const orderItem = pipe(
                    HashMap.filter(orderItems, (it) => it.item.id === item.id),
                    HashMap.mapWithIndex((oi, key) => [key, oi] as const),
                    HashMap.values,
                    A.fromIterable
                  )

                  return A.match(
                    orderItem,
                    () => [
                      <ListItem
                        key={item.identifier}
                        item={Order.NewActiveItem({ item: Data.struct(item) })}
                        dispatch={dispatch}
                      />,
                    ],
                    A.map(([key, it]) => (
                      <ListItem
                        key={item.identifier}
                        item={Order.ExistingActiveItem({ item: it, key })}
                        dispatch={dispatch}
                      />
                    ))
                  )
                })}
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
          order={orderState.order}
          onClick={() => {
            setReviewOrder(true)
          }}
        />
        <LazyOrderModal
          order={orderState.order}
          dispatch={dispatch}
          open={reviewOrder}
          onClose={() => setReviewOrder(false)}
        />
        <LazyItemModal dispatch={dispatch} activeItem={orderState.activeItem} />

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
    select: selectTheEntireMenu,
  })

  if (!restaurant) throw new NotFoundError()

  return {
    props: {
      restaurant,
      messages: (await import(`src/core/messages/${context.locale}.json`)).default,
    },
  }
})
