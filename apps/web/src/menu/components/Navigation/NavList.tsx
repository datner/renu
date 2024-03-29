import clsx from "clsx";
import { Venue } from "shared";
import { useTitle } from "src/menu/hooks/useTitle";
import * as _Menu from "src/menu/schema";
import { useNavContext } from "./context";

interface NavListProps {
  readonly categories: ReadonlyArray<Venue.Menu.MenuCategory>;
}

export const NavList = (props: NavListProps) => {
  const { categories } = props;
  const { attachNav, setActive, active } = useNavContext();
  const title = useTitle();

  return (
    <div
      role="tablist"
      aria-label="Categories"
      className="fixed bottom-0 z-20 flex border-t-2 min-h-0 shrink-0 inset-x-0 overflow-x-auto bg-white shadow snap-x snap-mandatory scroll-smooth gap-2 p-2 scroll-m-2"
    >
      {categories.map((it) => (
        <button
          key={it.id}
          ref={attachNav}
          aria-label={it.identifier}
          onClick={() => setActive(document.querySelector(`#${it.identifier}`))}
          className={clsx(
            active?.id === it.identifier
              ? [
                "ring-1",
                "5nth-1:bg-emerald-100 5nth-1:text-emerald-700 5nth-1:ring-emerald-400",
                "5nth-2:bg-ocre-100 5nth-2:text-ocre-700 5nth-2:ring-ocre-400",
                "5nth-3:bg-ginger-100 5nth-3:text-ginger-700 5nth-3:ring-ginger-400",
                "5nth-4:bg-coral-100 5nth-4:text-coral-700 5nth-4:ring-coral-400",
                "5nth-5:bg-blush-100 5nth-5:text-blush-700 5nth-5:ring-blush-400",
              ]
              : "border-transparent text-gray-500 hover:text-gray-700",
            "block flex-shrink-0 rounded-md snap-start px-4 py-4 text font-semibold scroll-m-2",
          )}
        >
          {title(it.content)}
        </button>
      ))}
    </div>
  );
};
