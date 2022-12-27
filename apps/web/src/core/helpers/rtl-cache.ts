import { createEmotionCache } from "@mantine/core"
import rtlPlugin from "stylis-plugin-rtl"

export const rtlCache = createEmotionCache({
  key: "renu-rtl",
  stylisPlugins: [rtlPlugin],
})

export const ltrCache = createEmotionCache({ key: "renu-ltr" })

export const getEmotionCache = (isRtl: boolean) => (isRtl ? rtlCache : ltrCache)
