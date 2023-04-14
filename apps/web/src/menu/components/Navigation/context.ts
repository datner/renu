import { createContext, useContext } from "react";
import { useNavBar } from "src/menu/hooks/useNavBar";

interface NavContext extends ReturnType<typeof useNavBar> {}

export const navContext = createContext<NavContext>(
  (() => {
    throw new Error("No NavContext found. Add Navigation.Root");
  }) as unknown as NavContext,
);

export const useNavContext = () => useContext(navContext);
