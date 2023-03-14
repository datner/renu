import { titleFor } from "src/core/helpers/content"
import { useLocale } from "src/core/hooks/useLocale"
import * as _Menu from "src/menu/schema"
import { forwardRef, memo } from "react"
import { clsx } from "@mantine/core"

type Props = {
  category: _Menu.Category
}

export const CategoryHeader = memo(
  forwardRef<HTMLDivElement, Props>(({ category }, ref) => {
    const title = titleFor(useLocale())

    return (
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
            ]
          )}
        >
          {title(category)}
        </h3>
      </div>
    )
  })
)

CategoryHeader.displayName = "CategoryHeader"
