import { BlitzLayout } from "@blitzjs/next";
import { ModalProvider } from "src/menu/components/ModalContext";
import { OrderContext } from "src/menu/components/OrderContext";

const MenuLayout: BlitzLayout = ({ children }) => {
  return (
    <ModalProvider>
      <OrderContext>{children}</OrderContext>
    </ModalProvider>
  );
};

export default MenuLayout;
