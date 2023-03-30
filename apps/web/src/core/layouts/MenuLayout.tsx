import { BlitzLayout } from "@blitzjs/next";
import { Provider as JotaiProvider } from "jotai";

const MenuLayout: BlitzLayout = ({ children }) => {
  return <JotaiProvider>{children}</JotaiProvider>;
};

export default MenuLayout;
