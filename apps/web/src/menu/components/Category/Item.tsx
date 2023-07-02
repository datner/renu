import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as HashMap from "@effect/data/HashMap";
import * as A from "@effect/data/ReadonlyArray";
import { memo } from "react";
import * as Order from "src/menu/hooks/useOrder";
import * as _Menu from "src/menu/schema";
import { ListItem } from "../ListItem";
import { useOrderState } from "../OrderContext";
import { Venue } from "shared";

interface ItemProps {
  item: Venue.Menu.MenuCategoryItem
  priority: boolean
}

export const Item = memo<ItemProps>(({ item, priority }) => {
  const state = useOrderState();
  const orderItems = Order.getOrderItems(state.order);

  const orderItem = pipe(
    HashMap.filter(orderItems, (it) => it.item.id === item.item.id),
    HashMap.mapWithIndex((oi, key) => [key, oi] as const),
    HashMap.values,
    A.fromIterable,
  );

  const items = A.match(
    orderItem,
    () => [
      <ListItem
        priority={priority}
        key={`${item.item.identifier}-0`}
        item={Order.NewActiveItem({ item: Data.struct(item.item) })}
      />,
    ],
    A.map(([key, item], i) => (
      <ListItem
        priority={priority}
        key={`${item.item.identifier}-${i}`}
        item={Order.ExistingActiveItem({ item, key })}
      />
    )),
  );
  return <>{items}</>;
});

Item.displayName = "Category.memo(Item)";
