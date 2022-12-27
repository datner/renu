import { Locale } from "@prisma/client"
import { useLocale } from "./useLocale"

export const useIsRtl = () => useLocale() === Locale.he
