import { ReactNode } from "react";
import { Aside as ContentAside } from "src/admin/components/Content/Aside";

type ContentAreaProps = {
  main: ReactNode;
  aside: ReactNode;
};

export function Content(props: ContentAreaProps) {
  const { main, aside } = props;
  return (
    <div className="grow min-h-0 flex-1 flex flex-col bg-gray-50">
      {/* Main content */}
      <div className="grow min-h-0 flex items-stretch">
        {main}
        {aside && <ContentAside>{aside}</ContentAside>}
      </div>
    </div>
  );
}
