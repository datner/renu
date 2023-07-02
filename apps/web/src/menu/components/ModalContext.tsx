import { createContext, ReactNode, useCallback, useContext, useRef } from "react";

type ModalContext = (open: boolean) => void;

const modalContext = createContext<ModalContext>(() => null);

const bodyScroll = {
  position: 0,
  lock() {
    this.position = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${this.position}px`;
    document.body.style.width = "100%";
  },
  release() {
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("top");
    document.body.style.removeProperty("width");
    window.scrollTo(0, this.position);
  },
};
export function ModalProvider(props: { children?: ReactNode }) {
  const amount = useRef(0);
  const state = useCallback<ModalContext>((open) => {
    open ? ++amount.current : --amount.current;
    console.log(amount.current);
    if (amount.current > 0) {
      bodyScroll.lock();
    } else {
      bodyScroll.release();
    }
  }, []);

  return <modalContext.Provider value={state}>{props.children}</modalContext.Provider>;
}

export const useRegisterModal = (open: boolean) => {
  const prev = useRef(open);
  const register = useContext(modalContext);
  if (prev.current !== open) {
    register(open);
  }
  prev.current = open;
};

export const useModalContext = () => useContext(modalContext);
