import * as O from "@effect/data/Option";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { PropsWithChildren, ReactNode } from "react";
import { Common } from "shared/schema";
import { toShekel } from "src/core/helpers/content";
import * as _Menu from "src/menu/schema";
import { AmountCounter } from "./AmountCounter";

type Props = {
  price: number;
  content: Common.Content;
  amount: number;
};

const StaticData = (
  props: PropsWithChildren<Omit<Props, "price" | "amount"> & { price: ReactNode }>,
) => {
  const { children, price, content } = props;
  const t = useTranslations("menu.Components.ItemData");

  return (
    <dl className="z-10 flex h-full flex-col p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-sm sm:text-base text-gray-800">{children}</dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="text-xs sm:text-sm text-gray-500 whitespace-normal line-clamp-2 ">
        {O.getOrNull(content.description)}
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
          {price}
        </span>
      </dd>
    </dl>
  );
};

export const ItemData = (props: Props) => {
  const { price, content, amount } = props;
  const t = useTranslations("menu.Components.ItemData");

  return (
    <StaticData content={content} price={price === 0 ? t("priced by choice") : toShekel(price)}>
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
    </StaticData>
  );
};
