import { ReactNode } from "react";
import { useNavBar } from "src/menu/hooks/useNavBar";
import { navContext } from "./context";

export const Root = ({ children }: { children?: ReactNode }) => {
  const navBar = useNavBar();

  return (
    <navContext.Provider value={navBar}>
      <div
        ref={navBar.setRoot}
        className="flex flex-col grow min-h-0 bg-gray-50 scroll-smooth overflow-x-hidden"
      >
        {children}
      </div>
    </navContext.Provider>
  );
};
