import { Provider as JotaiProvider } from "jotai"
import { BlitzLayout } from "@blitzjs/next"

const MenuLayout: BlitzLayout = ({ children }) => {
  return <JotaiProvider>{children}</JotaiProvider>
}

export default MenuLayout
