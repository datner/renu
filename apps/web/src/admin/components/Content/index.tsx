import { Header as ContentHeader } from "src/admin/components/Content/Header"
import { Main as ContentMain } from "src/admin/components/Content/Main"
import { Aside as ContentAside } from "src/admin/components/Content/Aside"
import { ReactNode } from "react"

type ContentAreaProps = {
  main: ReactNode
  aside: ReactNode
}

export function Content(props: ContentAreaProps) {
  const { main, aside } = props
  return (
    <div className="grow min-h-0 flex-1 flex flex-col bg-gray-50">
      <ContentHeader />
      {/* Main content */}
      <div className="grow min-h-0 flex items-stretch">
        <ContentMain>{main}</ContentMain>
        {aside && <ContentAside>{aside}</ContentAside>}
      </div>
    </div>
  )
}
