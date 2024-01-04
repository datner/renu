import "@mantine/core/styles.css";
import { createTheme, DirectionProvider, MantineProvider as MantineProvider_ } from "@mantine/core";
import { Locale } from "database";
import { ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "src/core/hooks/useIsomorphicLayoutEffect";
import { useLocale } from "src/core/hooks/useLocale";

const theme = createTheme({
  primaryColor: "teal",
  colors: {
    teal: [
      "#70AD99",
      "#CFE4DD",
      "#BDDFD5",
      "#A0C9BB",
      "#70AD99",
      "#419277",
      "#117755",
      "#0D5940",
      "#093C2B",
      "#041E15",
    ],
  },
});

export function MantineProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const isRtl = locale === Locale.he;
  const dir = isRtl ? "rtl" : "ltr";

  useIsomorphicLayoutEffect(() => {
    document.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  return (
    <DirectionProvider>
      <MantineProvider_
        theme={theme}
      >
        {children}
      </MantineProvider_>
    </DirectionProvider>
  );
}
