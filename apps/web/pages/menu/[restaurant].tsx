import { BlitzPage } from "@blitzjs/auth";
import * as O from "@effect/data/Option";
import * as Order from "@effect/data/Order";
import * as A from "@effect/data/ReadonlyArray";
import * as Str from "@effect/data/String";
import * as Parser from "@effect/schema/Parser";
import { NotFoundError } from "blitz";
import { InferGetServerSidePropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Fragment, useMemo, useState } from "react";
import { Venue } from "shared";
import { gSSP } from "src/blitz-server";
import { titleFor } from "src/core/helpers/content";
import { useLocale } from "src/core/hooks/useLocale";
import MenuLayout from "src/core/layouts/MenuLayout";
import * as Category from "src/menu/components/Category";
import { Closed } from "src/menu/components/Closed";
import * as Navigation from "src/menu/components/Navigation";
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
const LazyOrderModal = dynamic(() => import("src/menu/components/PayPlusOrderModal"), {
  loading: () => <Fragment />,
});

const CategoryOrder = Order.mapInput(Str.Order, (b: Venue.Menu.Category) => b.identifier);

export const Menu: BlitzPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { menu } = props;
  const restaurant = useMemo(() => Parser.decodeSync(Venue.Menu.Menu)(menu), [menu]);
  const { categories } = restaurant;
  const orderedCategories = useMemo(() => A.sort(categories as Array<Venue.Menu.Category>, CategoryOrder), [
    categories,
  ]);
  const locale = useLocale();
  const [reviewOrder, setReviewOrder] = useState(false);

  const venueTitle = O.map(A.findFirst(restaurant.content, _ => _.locale === locale), _ => _.name);
  const orUnknown = O.getOrElse(() => "unknown");

  if (!restaurant.open) {
    return (
      <>
        <Head>
          <title>{orUnknown(venueTitle) + " | Renu"}</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no"
          />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon-precomposed" href="/24round4.png" />
        </Head>
        <Closed venue={venueTitle} />
      </>
    );
  }

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=1, user-scalable=0, shrink-to-fit=no"
        />
        <title>{orUnknown(venueTitle) + " | Renu"}</title>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon-precomposed" href="/24round4.png" />
      </Head>
      <Navigation.Root>
        <Navigation.NavList categories={orderedCategories} />
        <div>
          {orderedCategories.map((category) => (
            <Category.Section key={category.id} category={category}>
              <Category.Items>
                {category.categoryItems.map((ci, i) => <Category.Item priority={i < 6} key={ci.item.id} item={ci} />)}
              </Category.Items>
            </Category.Section>
          ))}
        </div>
        {O.getOrNull(
          O.map(restaurant.simpleContactInfo, content => <div className="mt-4 text-center">{content}</div>),
        )}
        <div className="mt-4 mb-36 text-center">
          ביטול עסקה בהתאם לתקנות הגנת הצרכן (ביטול עסקה), התשע״א-2010 וחוק הגנת הצרכן, התשמ״א-1981
          <br />
          פרטי הלקוחות לא מועברים לצד ג למעט עבור ביצוע העסקה
        </div>
      </Navigation.Root>
      <LazyViewOrderButton
        onClick={() => setReviewOrder(true)}
      />
      <LazyOrderModal
        venueId={restaurant.id}
        open={reviewOrder}
        onClose={() => setReviewOrder(false)}
      />
      <LazyItemModal />
    </>
  );
};

Menu.getLayout = (comp) => <MenuLayout>{comp}</MenuLayout>;

export default Menu;

export const getServerSideProps = gSSP(async (context) => {
  const { restaurant: identifier } = Query.parse(context.params);

  try {
    const menu = await getMenu({ identifier }, context.ctx);
    context.ctx.prefetchQuery(getVenueClearingProvider, { identifier });

    context.res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=10800",
    );
    
    return {
      props: {
        menu,
        messages: (await import(`src/core/messages/${context.locale}.json`)).default,
      },
    };
  } catch (e) {
    console.error(e);
    throw new NotFoundError();
  }
});
