import { useLocale } from "src/core/hooks/useLocale"
import { Locale } from "@prisma/client"
import { useIsomorphicLayoutEffect } from "src/core/hooks/useIsomorphicLayoutEffect"
import { MantineProvider as MantineProvider_ } from "@mantine/core"
import { getEmotionCache } from "src/core/helpers/rtl-cache"
import { RouterTransition } from "src/core/components/RouterTransition"
import { ReactNode } from "react"

export function MantineProvider({ children }: { children: ReactNode }) {
  const locale = useLocale()
  const isRtl = locale === Locale.he
  const dir = isRtl ? "rtl" : "ltr"

  useIsomorphicLayoutEffect(() => {
    document.dir = dir
    document.documentElement.lang = locale
  }, [locale, dir])

  return (
    <MantineProvider_
      withGlobalStyles
      withNormalizeCSS
      emotionCache={getEmotionCache(isRtl)}
      theme={{
        dir,
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
      }}
    >
      <RouterTransition />
      {children}
    </MantineProvider_>
  )
}
