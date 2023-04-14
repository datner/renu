import { Locale } from "database";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { titleFor } from "src/core/helpers/content";

export const useTitle = () => {
  const locale = useLocale() as Locale;
  return useMemo(() => titleFor(locale), [locale]);
};
