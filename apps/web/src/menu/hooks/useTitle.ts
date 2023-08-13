import { flow, } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import { Locale } from "database";
import { useLocale } from "next-intl";
import { useMemo } from "react";

type GetTitle = <A extends { readonly name: string; readonly locale: Locale }>(
  content: ReadonlyArray<A>,
) => Option.Option<A>;

export const useTitle = () => {
  const locale = useLocale() as Locale;
  return useMemo(
    () =>
      flow(
        A.findFirst(_ => _.locale === locale) as GetTitle,
        Option.map(_ => _.name),
        Option.getOrElse(() => "Unknown"),
      ),
    [
      locale,
    ],
  );
};
