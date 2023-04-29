import { flow, pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import { Locale } from "database";
import * as O from "monocle-ts/Optional";
import { Common } from "shared/schema";
import { Nullish } from "src/menu/types/utils";
import { get } from "./common";
import { divide } from "./number";

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
).getOption;

export const price = get(priceOption, 0);
export const toShekel = flow(divide(100), shekel.format);
export const priceShekel = flow(price, toShekel);
export const getContentFor = (content: ReadonlyArray<Common.Content>, locale: Locale) => A.findFirst(content, c => c.locale === locale);
// export const titleFor = (locale: Locale) => get(contentOption("name", locale), "");
export const titleFor = (locale: Locale) => (content: ReadonlyArray<Common.Content>) =>
  pipe(
    getContentFor(content, locale),
    Option.map(c => c.name),
    Option.getOrElse(() => "Unknown"),
  );
// export const descriptionFor = (locale: Locale) => get(contentOption("description", locale), "");
export const descriptionFor = (locale: Locale) => (content: ReadonlyArray<Common.Content>) =>
  pipe(
    A.findFirst(content, c => c.locale === locale),
    Option.flatMap(c => c.description),
    Option.getOrElse(() => ""),
  );

export const contentGet = (prop: keyof ContentPartial, locale: Locale) => get(contentOption(prop, locale), "");
