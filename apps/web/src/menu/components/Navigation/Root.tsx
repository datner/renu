import { ReactNode } from "react";
import { useNavBar } from "src/menu/hooks/useNavBar";
import { PageHeader } from "../PageHeader";
import { navContext } from "./context";

export const Root = ({ children }: { children?: ReactNode }) => {
  const navBar = useNavBar();

  return (
    <navContext.Provider value={navBar}>
      <div className="flex flex-col grow">
        <PageHeader />
        <div
          ref={navBar.setRoot}
          className="flex flex-col grow min-h-0 bg-gray-50 scroll-smooth overflow-x-hidden"
        >
          {children}
        </div>
      </div>
    </navContext.Provider>
  );
};
