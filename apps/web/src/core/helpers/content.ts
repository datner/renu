import { pipe } from "@effect/data/Function";
import * as Num from "@effect/data/Number";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import { Locale } from "database";
import * as O from "monocle-ts/Optional";
import { Common } from "shared/schema";
import { Nullish } from "src/menu/types/utils";

interface ContentPartial {
  locale: Locale;
  name: string;
  description?: Nullish<string>;
}

interface ContentfulPartial {
  content: readonly ContentPartial[];
}

export const contentOption = (prop: keyof ContentPartial, locale: Locale) =>
  pipe(
    O.id<ContentfulPartial | null>(),
    O.fromNullable,
    O.prop("content"),
    O.findFirst((it) => it.locale === locale),
    O.prop(prop),
    O.fromNullable,
  ).getOption;

export const shekel = Intl.NumberFormat("us-IL", {
  style: "currency",
  currency: "ILS",
});

export const priceOption = pipe(
  O.id<{ price: number } | null>(),
  O.fromNullable,
  O.prop("price"),
);

export const toShekel = (cost: number) => pipe(Num.divide(cost, 100), shekel.format);
export const priceShekel = (
  k: {
    price: number;
  } | null,
) => toShekel(k?.price ?? 0);
export const getContentFor = (content: ReadonlyArray<Common.Content>, locale: Locale) =>
  A.findFirst(content, c => c.locale === locale);

export const titleFor = (locale: Locale) => (content: ReadonlyArray<Common.Content>) =>
  pipe(
    getContentFor(content, locale),
    Option.map(c => c.name),
    Option.getOrElse(() => "Unknown"),
  );

export const descriptionFor = (locale: Locale) => (content: ReadonlyArray<Common.Content>) =>
  pipe(
    A.findFirst(content, c => c.locale === locale),
    Option.flatMap(c => c.description),
    Option.getOrElse(() => ""),
  );
