import { clsx } from "@mantine/core";
import { ReactNode, forwardRef, memo } from "react";
import * as _Menu from "src/menu/schema";
import { useTitle } from "../hooks/useTitle";
import { useNavContext } from "./Navigation";

type Props = {
  category: _Menu.Category;
  children?: ReactNode
};

export const CategoryHeader = memo(
  forwardRef<HTMLDivElement, Props>(({ category, children }, ref) => {
    const title = useTitle();
    const { active, observe } = useNavContext();
    return (
      <div
        id={category.identifier}
        aria-current={active?.id === category.identifier && "location"}
        ref={observe}
        key={category.id}
        className={clsx("group pt-14", [
          "5nth-1:bg-emerald-100",
          "5nth-2:bg-ocre-100",
          "5nth-3:bg-ginger-100",
          "5nth-4:bg-coral-100",
          "5nth-5:bg-blush-100",
        ])}
      >
        <div ref={ref} className="mb-2 px-4 mx-0.5 py-1 font-medium text-gray-800">
          <h3
            className={clsx(
              "font-bold font-title text-start text-5xl sm:text-kxl underline underline-offset-4 decoration-3 leading-tight",
              [
                "group-5nth-1:text-emerald-800 group-5nth-1:decoration-emerald-500",
                "group-5nth-2:text-ocre-800 group-5nth-2:decoration-ocre-400",
                "group-5nth-3:text-ginger-800 group-5nth-3:decoration-ginger-400",
                "group-5nth-4:text-coral-800 group-5nth-4:decoration-coral-400",
                "group-5nth-5:text-blush-800 group-5nth-5:decoration-blush-400",
              ],
            )}
          >
            {title(category.content as any)}
          </h3>
        </div>
        {children}
        <div
          className={clsx("h-16 bg-gradient-to-b", [
            "group-5nth-1:from-emerald-100 group-5nth-1:to-ocre-100",
            "group-5nth-2:from-ocre-100 group-5nth-2:to-ginger-100",
            "group-5nth-3:from-ginger-100 group-5nth-3:to-coral-100",
            "group-5nth-4:from-coral-100 group-5nth-4:to-blush-100",
            "group-5nth-5:from-blush-100 group-5nth-5:to-emerald-100",
            "group-last:group-last:to-gray-50",
          ])}
        />
      </div>
    );
  }),
);

CategoryHeader.displayName = "CategoryHeader";
