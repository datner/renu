import { BlitzPage } from "@blitzjs/auth";
import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as A from "@effect/data/ReadonlyArray";
import * as Parser from "@effect/schema/Parser";
import { NotFoundError } from "blitz";
import clsx from "clsx";
import db, { Locale } from "db";
import { GetStaticPaths, InferGetStaticPropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import Script from "next/script";
import { Fragment, Suspense, useMemo, useState } from "react";
import { gSP, gSSP } from "src/blitz-server";
import { contentOption, titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import MenuLayout from "src/core/layouts/MenuLayout";
import { CategoryHeader } from "src/menu/components/CategoryHeader";
import { Closed } from "src/menu/components/Closed";
import { ListItem } from "src/menu/components/ListItem";
import { useNavBar } from "src/menu/hooks/useNavBar";
import * as Order from "src/menu/hooks/useOrder";
import getMenu from "src/menu/queries/getMenu";
import * as _Menu from "src/menu/schema";
import { Query } from "src/menu/validations/page";
import getVenueClearingProvider from "src/venues/queries/getVenueClearingType";

const LazyViewOrderButton = dynamic(() => import("src/menu/components/ViewOrderButton"), {
  loading: () => <Fragment />,
});
const LazyItemModal = dynamic(() => import("src/menu/components/ItemModal"), {
  loading: () => <Fragment />,
});
const LazyOrderModal = dynamic(() => import("src/menu/components/OrderModal"), {
  loading: () => <Fragment />,
});

export const Menu: BlitzPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  const { menu } = props;
  const restaurant = useMemo(() => Parser.parse(_Menu.FullMenu)(menu), [menu]);
  const { categories } = restaurant;
  const { attachNav, setRoot, observe, active, setActive } = useNavBar();
  // add the item modal state to the dispatch as well, just for laughs
  const [orderState, dispatch] = Order.useOrder();
  const locale = useLocale();
  const [reviewOrder, setReviewOrder] = useState(false);

  const getTitle = titleFor(locale);

  if (!restaurant.open) {
    return (
      <>
        <Head>
          <title>{getTitle(restaurant) + " | Renu"}</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Closed venue={contentOption("name", locale)(restaurant)} />
      </>
    );
  }

  const orderItems = Order.getOrderItems(orderState.order);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{getTitle(restaurant) + " | Renu"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script id="posthog-script">
        {`
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_f1C0RM83nRnhOF55jgpimQPdhzJsIpp7t2PMNi2XAu',{api_host:'https://app.posthog.com'})
`}
      </Script>
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
                "block flex-shrink-0 rounded-md snap-start px-3 py-2 text-sm font-semibold scroll-m-2",
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
                    A.fromIterable,
                  );

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
                    )),
                  );
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
            setReviewOrder(true);
          }}
        />
        <Suspense fallback={<></>}>
          <LazyOrderModal
            order={orderState.order}
            dispatch={dispatch}
            open={reviewOrder}
            onClose={() => setReviewOrder(false)}
          />
        </Suspense>
        <LazyItemModal dispatch={dispatch} activeItem={orderState.activeItem} />

        {restaurant.simpleContactInfo && <div className="mt-4 text-center">{restaurant.simpleContactInfo}</div>}
        <div className="mt-4 text-center">
          ביטול עסקה בהתאם לתקנות הגנת הצרכן (ביטול עסקה), התשע״א-2010 וחוק הגנת הצרכן, התשמ״א-1981
        </div>
      </div>
    </>
  );
};

Menu.getLayout = (comp) => <MenuLayout>{comp}</MenuLayout>;

export default Menu;

export const getStaticPaths: GetStaticPaths = async () => {
  const venues = await db.venue.findMany();

  const locales = Object.values(Locale);
  return {
    fallback: "blocking",
    paths: locales.flatMap((locale) => venues.map((it) => ({ params: { restaurant: it.identifier }, locale }))),
  };
};

export const getStaticProps = gSP(async (context) => {
  const { restaurant: identifier } = Query.parse(context.params);

  try {
    const menu = await getMenu({ identifier }, context.ctx);
    context.ctx.prefetchQuery(getVenueClearingProvider, { identifier });

    return {
      props: {
        menu,
        messages: (await import(`src/core/messages/${context.locale}.json`)).default,
      },
      revalidate: 60,
    };
  } catch (e) {
    throw new NotFoundError();
  }
});
