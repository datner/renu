import { toShekel } from "src/core/helpers/content"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { AmountCounter } from "./AmountCounter"

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
      <dd className="text-sm sm:text-base text-gray-800 overflow-hidden">
        <AmountCounter label={content.name} amount={amount} />
      </dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="text-xs sm:text-sm text-gray-500 whitespace-normal line-clamp-2 ">
        {content.description}
      </dd>
      <dt className="sr-only">{t("price")}</dt>
      <div className="flex-grow" />
      <dd>
        <span className="rounded-full bg-emerald-100 px-2 py-1 ml-1 text-xs font-medium text-emerald-800">
          {toShekel(price)}
        </span>
      </dd>
    </dl>
  )
})
