import { toShekel } from "src/core/helpers/content"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { AmountCounter } from "./AmountCounter"
import clsx from "clsx"

type Props = {
  price: number
  content: { name: string; description: string }
  amount: number
}

export const ItemData = memo(function ItemData(props: Props) {
  const { price, content, amount } = props
  const t = useTranslations("menu.Components.ItemData")

  return (
    <dl className="z-10 flex h-full flex-col p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-sm sm:text-base text-gray-800">
        <AmountCounter
          className={clsx([
            "group-5nth-1:text-emerald-600",
            "group-5nth-2:text-ocre-600",
            "group-5nth-3:text-ginger-600",
            "group-5nth-4:text-coral-600",
            "group-5nth-5:text-blush-600",
          ])}
          label={content.name}
          amount={amount}
        />
      </dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="text-xs sm:text-sm text-gray-500 whitespace-normal line-clamp-2 ">
        {content.description}
      </dd>
      <dt className="sr-only">{t("price")}</dt>
      <div className="flex-grow" />
      <dd>
        <span
          className={clsx("badge badge-primary", [
            "group-5nth-1:badge-primary",
            "group-5nth-2:badge-secondary",
            "group-5nth-3:badge-ghost",
            "group-5nth-4:badge-accent",
            "group-5nth-5:badge-info",
          ])}
        >
          {toShekel(price)}
        </span>
      </dd>
    </dl>
  )
})
