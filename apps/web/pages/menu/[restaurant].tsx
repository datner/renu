import { BlitzPage } from "@blitzjs/auth";
import * as Parser from "@effect/schema/Parser";
import { NotFoundError } from "blitz";
import db, { Locale } from "db";
import { GetStaticPaths, InferGetStaticPropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Fragment, useMemo, useState } from "react";
import { gSP } from "src/blitz-server";
import { contentOption, titleFor } from "src/core/helpers/content";
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

export const Menu: BlitzPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {
  const { menu } = props;
  const restaurant = useMemo(() => Parser.parse(_Menu.FullMenu)(menu), [menu]);
  const { categories } = restaurant;
  // add the item modal state to the dispatch as well, just for laughs
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

  return (
    <OrderContext>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{getTitle(restaurant) + " | Renu"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PostHogScript />
      <Navigation.Root>
        <Navigation.NavList categories={categories} />
        <div>
          {categories?.map((category) => (
            <Category.Section category={category}>
              <Category.Items>
                {category.categoryItems.map((ci) => <Category.Item item={ci} />)}
              </Category.Items>
            </Category.Section>
          ))}
        </div>
        <LazyViewOrderButton onClick={() => setReviewOrder(true)} />
        <LazyOrderModal
          open={reviewOrder}
          onClose={() => setReviewOrder(false)}
        />
        <LazyItemModal />

        {restaurant.simpleContactInfo && <div className="mt-4 text-center">{restaurant.simpleContactInfo}</div>}
        <div className="mt-4 text-center">
          ביטול עסקה בהתאם לתקנות הגנת הצרכן (ביטול עסקה), התשע״א-2010 וחוק הגנת הצרכן, התשמ״א-1981
        </div>
      </Navigation.Root>
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
