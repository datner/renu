import { BlitzPage } from "@blitzjs/auth";
import * as Schema from "@effect/schema/Parser";
import { NotFoundError } from "blitz";
import { Option, Order, ReadonlyArray, String as Str } from "effect";
import { InferGetServerSidePropsType } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useMemo, useState } from "react";
import { Venue } from "shared";
import { gSSP } from "src/blitz-server";
import { useLocale } from "src/core/hooks/useLocale";
import MenuLayout from "src/core/layouts/MenuLayout";
import * as Category from "src/menu/components/Category";
import { Closed } from "src/menu/components/Closed";
import * as Navigation from "src/menu/components/Navigation";
import { VenueContext } from "src/menu/components/VenueContext";
import getMenu from "src/menu/queries/getMenu";
import * as _Menu from "src/menu/schema";
import { Query } from "src/menu/validations/page";
import getVenueClearingIntegration from "src/venues/queries/getVenueClearingIntegration";

const LazyViewOrderButton = dynamic(() => import("src/menu/components/ViewOrderButton"));
const LazyItemModal = dynamic(() => import("src/menu/components/ItemModal"));
const LazyOrderModal = dynamic(() => import("src/menu/components/PayPlusOrderModal"));

const CategoryOrder = Order.mapInput(Str.Order, (b: Venue.Menu.Category) => b.identifier);

export const Menu: BlitzPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { menu } = props;
  console.log(menu);
  const restaurant = useMemo(() => Schema.decodeSync(Venue.Menu.Menu)(menu), [menu]);
  const { categories } = restaurant;
  const orderedCategories = useMemo(() => ReadonlyArray.sort(categories as Array<Venue.Menu.Category>, CategoryOrder), [
    categories,
  ]);
  const locale = useLocale();
  const [reviewOrder, setReviewOrder] = useState(false);

  const venueTitle = Option.map(ReadonlyArray.findFirst(restaurant.content, _ => _.locale === locale), _ => _.name);
  const orUnknown = Option.getOrElse(() => "unknown");

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
      <VenueContext menu={restaurant}>
        <Navigation.Root>
          <Navigation.NavList categories={orderedCategories} />
          <div>
            {orderedCategories.map((category) => (
              <Category.Section key={category.id} category={category}>
                <Category.Items>
                  {category.categoryItems.map((ci, i) => <Category.Item priority={i < 6} key={ci.Item.id} item={ci} />)}
                </Category.Items>
              </Category.Section>
            ))}
          </div>
          {Option.getOrNull(
            Option.map(restaurant.simpleContactInfo, content => <div className="mt-4 text-center">{content}</div>),
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
      </VenueContext>
    </>
  );
};

Menu.getLayout = (comp) => <MenuLayout>{comp}</MenuLayout>;

export default Menu;

export const getServerSideProps = gSSP(async (context) => {
  const { restaurant: identifier } = Query.parse(context.params);

  try {
    const menu = await getMenu({ identifier }, context.ctx);
    context.ctx.prefetchQuery(getVenueClearingIntegration, menu.id);

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
    throw new NotFoundError();
  }
});
