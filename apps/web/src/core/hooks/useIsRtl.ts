import { Locale } from "database"
import { useLocale } from "./useLocale"

export const useIsRtl = () => useLocale() === Locale.he
