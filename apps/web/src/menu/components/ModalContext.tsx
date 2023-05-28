import { createContext, ReactNode, useCallback, useContext, useRef } from "react";

type ModalContext = (open: boolean) => void;

const modalContext = createContext<ModalContext>(() => null);

export function ModalProvider(props: { children?: ReactNode }) {
  const amount = useRef(0);
  const state = useCallback<ModalContext>((open) => {
    open ? ++amount.current : --amount.current;
    document.body.style.overflowY = amount.current > 0 ? "hidden" : "unset";
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
