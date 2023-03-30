import { Locale } from "database";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { z } from "zod";

export const zLocale = z.nativeEnum(Locale).default(Locale.en);

export function useLocale() {
  const router = useRouter();
  return useMemo(() => zLocale.parse(router.locale), [router.locale]);
}
