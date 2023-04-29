import { BlitzPage } from "@blitzjs/auth";
import * as O from "@effect/data/Option";
import * as Parser from "@effect/schema/Parser";
import { NotFoundError } from "blitz";
import db, { Locale } from "db";
import { GetStaticPaths, InferGetStaticPropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Fragment, useMemo, useState } from "react";
import { Venue } from "shared";
import { gSP } from "src/blitz-server";
import { getContentFor, titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import MenuLayout from "src/core/layouts/MenuLayout";
import * as Category from "src/menu/components/Category";
import { Closed } from "src/menu/components/Closed";
import * as Navigation from "src/menu/components/Navigation";
import { OrderContext } from "src/menu/components/OrderContext";
import { PostHogScript } from "src/menu/components/PostHogScript";
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
const LazyPhoneModal = dynamic(() => import("src/menu/components/PhoneModal").then(m => m.FeedbackModal), {
  loading: () => <Fragment />,
});

export const Menu: BlitzPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  const { menu } = props;
  const restaurant = useMemo(() => Parser.decode(Venue.Menu.Menu)(menu), [menu]);
  const { categories } = restaurant;
  // add the item modal state to the dispatch as well, just for laughs
  const locale = useLocale();
  const [reviewOrder, setReviewOrder] = useState(false);

  const getTitle = titleFor(locale);

  if (!restaurant.open) {
    return (
      <>
        <Head>
          <title>{getTitle(restaurant.content) + " | Renu"}</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Closed venue={O.map(getContentFor(restaurant.content, locale), c => c.name)} />
      </>
    );
  }

  return (
    <OrderContext>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{getTitle(restaurant.content) + " | Renu"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PostHogScript />
      <Navigation.Root>
        <Navigation.NavList categories={categories} />
        <div>
          {categories?.map((category) => (
            <Category.Section key={category.id} category={category}>
              <Category.Items>
                {category.categoryItems.map((ci) => <Category.Item key={ci.item.id} item={ci} />)}
              </Category.Items>
            </Category.Section>
          ))}
        </div>
        {O.getOrNull(O.map(restaurant.simpleContactInfo, content => <div className="mt-4 text-center">{content}</div>))}
        <div className="mt-4 text-center">
          ביטול עסקה בהתאם לתקנות הגנת הצרכן (ביטול עסקה), התשע״א-2010 וחוק הגנת הצרכן, התשמ״א-1981
        </div>
      </Navigation.Root>
      <LazyViewOrderButton onClick={() => setReviewOrder(true)} />
      <LazyOrderModal
        venueId={restaurant.id}
        open={reviewOrder}
        onClose={() => setReviewOrder(false)}
      />
      <LazyItemModal />
      <LazyPhoneModal />
    </OrderContext>
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
