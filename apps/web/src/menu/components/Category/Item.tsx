import { Data, HashMap, pipe, ReadonlyArray as A } from "effect";
import { memo } from "react";
import { Venue } from "shared";
import * as Order from "src/menu/hooks/useOrder";
import * as _Menu from "src/menu/schema";
import { ListItem } from "../ListItem";
import { useOrderState } from "../OrderContext";

interface ItemProps {
  item: Venue.Menu.MenuCategoryItem;
  priority: boolean;
}

export const Item = memo<ItemProps>(({ item, priority }) => {
  const state = useOrderState();
  const orderItems = Order.getOrderItems(state.order);

  const orderItem = pipe(
    HashMap.filter(orderItems, (it) => it.item.id === item.Item.id),
    HashMap.map((oi, key) => [key, oi] as const),
    HashMap.values,
    A.fromIterable,
  );

  const items = A.match(orderItem, {
    onEmpty: () => [
      <ListItem
        priority={priority}
        key={`${item.Item.identifier}-0`}
        item={Order.NewActiveItem({ item: Data.struct(item.Item) })}
      />,
    ],
    onNonEmpty: A.map(([key, item], i) => (
      <ListItem
        priority={priority}
        key={`${item.item.identifier}-${i}`}
        item={Order.ExistingActiveItem({ item, key })}
      />
    )),
  });
  return <>{items}</>;
});

Item.displayName = "Category.memo(Item)";
