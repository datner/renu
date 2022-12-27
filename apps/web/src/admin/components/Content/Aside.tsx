import { ReactNode } from "react"

type Props = { children?: ReactNode }

export function Aside({ children }: Props) {
  return (
    <aside className="hidden min-h-0 flex-col relative w-96 bg-white ltr:border-l rtl:border-r border-gray-200 lg:flex">
      {children}
    </aside>
  )
}
