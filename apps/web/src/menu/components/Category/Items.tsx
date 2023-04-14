import { ReactNode } from "react";

export const Items = ({ children }: { children?: ReactNode }) => (
  <ul role="list" className="flex flex-col gap-2 pb-2 group-last:min-h-screen">{children}</ul>
);
