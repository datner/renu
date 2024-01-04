import {
  Boolean,
  Brand,
  Data,
  Equal,
  HashMap,
  Match,
  Number as N,
  Option,
  pipe,
  Predicate,
  ReadonlyArray,
} from "effect";
import { nanoid } from "nanoid";
import { Dispatch, useReducer } from "react";
import { Item, ModifierConfig, Venue } from "shared";
import { Refinement } from "shared/effect";
import { refineTag } from "shared/effect/Refinement";
import { Number } from "shared/schema";

export type OrderItemKey = string & Brand.Brand<"OrderItemKey">;
export const OrderItemKey = Brand.nominal<OrderItemKey>();

export type OrderItemModifierHashMap = HashMap.HashMap<Item.Modifier.Id, OrderItemModifier>;
export type OrderItemHashMap = HashMap.HashMap<OrderItemKey, OrderItem>;

export interface SingleOrderItem extends Data.Case {
  readonly _tag: "SingleOrderItem";
  readonly comment: string;
  readonly modifiers: OrderItemModifierHashMap;
  readonly item: Data.Data<Venue.Menu.MenuItem>;
  readonly cost: Number.Cost;
  readonly valid: boolean;
}
export const SingleOrderItem = Data.tagged<SingleOrderItem>("SingleOrderItem");

export interface MultiOrderItem extends Data.Case {
  readonly _tag: "MultiOrderItem";
  readonly amount: Number.Multiple;
  readonly comment: string;
  readonly modifiers: OrderItemModifierHashMap;
  readonly item: Data.Data<Venue.Menu.MenuItem>;
  readonly cost: Number.Cost;
  readonly valid: boolean;
}
export const MultiOrderItem = Data.tagged<MultiOrderItem>("MultiOrderItem");

export type OrderItem = SingleOrderItem | MultiOrderItem;

export interface OneOf extends Data.Case {
  readonly _tag: "OneOf";
  readonly id: Item.Modifier.Id;
  readonly choice: string;
  readonly amount: Number.Amount;
  readonly config: Data.Data<ModifierConfig.OneOf.OneOf>;
}
export const OneOf = Data.tagged<OneOf>("OneOf");

export interface Extras extends Data.Case {
  readonly _tag: "Extras";
  readonly id: Item.Modifier.Id;
  readonly choices: HashMap.HashMap<string, Number.Amount>;
  readonly config: Data.Data<ModifierConfig.Extras.Extras>;
}
export const Extras = Data.tagged<Extras>("Extras");
export type OrderItemModifier = OneOf | Extras;

export interface ActiveOrder extends Data.Case {
  readonly _tag: "ActiveOrder";
  readonly items: HashMap.HashMap<OrderItemKey, OrderItem>;
  readonly totalAmount: Number.Amount;
  readonly totalCost: Number.Cost;
  readonly valid: boolean;
  // readonly currentItems: Chunk.Chunk<readonly [string, OrderItem]>
}
export const ActiveOrder = Data.tagged<ActiveOrder>("ActiveOrder");

export interface EmptyOrder extends Data.Case {
  readonly _tag: "EmptyOrder";
}
export const EmptyOrder = Data.tagged<EmptyOrder>("EmptyOrder");

export interface NewActiveItem extends Data.Case {
  readonly _tag: "NewActiveItem";
  readonly item: Data.Data<Venue.Menu.MenuItem>;
}
export const NewActiveItem = Data.tagged<NewActiveItem>("NewActiveItem");

export interface ExistingActiveItem extends Data.Case {
  readonly _tag: "ExistingActiveItem";
  readonly item: OrderItem;
  readonly key: OrderItemKey;
}
export const ExistingActiveItem = Data.tagged<ExistingActiveItem>("ExistingActiveItem");

export type ActiveItem = NewActiveItem | ExistingActiveItem;

export type Order = ActiveOrder | EmptyOrder;

export interface State extends Data.Case {
  readonly _tag: "State";
  readonly order: Order;
  readonly activeItem: Option.Option<ActiveItem>;
}
export const State = Data.tagged<State>("State");

type Action = (state: State) => State;

const getOneOfCost = (oneOf: OneOf) =>
  pipe(
    ReadonlyArray.findFirst(oneOf.config.options, (o) => o.identifier === oneOf.choice),
    Option.map((o) => o.price * oneOf.amount),
    Option.getOrElse(() => 0),
  );

const getExtrasCost = (extras: Extras) => {
  return Option.reduceCompact(
    ReadonlyArray.map(
      extras.config.options,
      (o) => Option.map(HashMap.get(extras.choices, o.identifier), (amount) => o.price * (o.multi ? amount : 1)),
    ),
    0,
    N.sum,
  );
};

const getModifierCost = pipe(
  Match.type<OrderItemModifier>(),
  Match.tag("OneOf", (o) => getOneOfCost(o)), // TODO: this is a bug with Match :(
  Match.tag("Extras", getExtrasCost),
  Match.exhaustive,
);

const getAllModifiersCost = (modsMap: OrderItemModifierHashMap) =>
  pipe(modsMap, HashMap.map(getModifierCost), HashMap.values, N.sumAll);

export const getAmount = pipe(
  Match.type<OrderItem>(),
  Match.tag("SingleOrderItem", () => 1),
  Match.tag("MultiOrderItem", (o) => o.amount as number),
  Match.exhaustive,
);

const isOnlyItem = (key: OrderItemKey) =>
  Predicate.every([
    (o: ActiveOrder) => HashMap.has(o.items, key),
    (o: ActiveOrder) => HashMap.size(o.items) === 1,
  ]);

const isLastItem = (key: OrderItemKey) => Predicate.and(isOnlyItem(key), (o: ActiveOrder) => o.totalAmount === 1);

export const isOneOf: Predicate.Refinement<OrderItemModifier, OneOf> = Refinement.isTagged("OneOf");

export const isExtras: Predicate.Refinement<OrderItemModifier, Extras> = Refinement.isTagged("Extras");

export const isActiveOrder: Predicate.Refinement<Order, ActiveOrder> = Refinement.isTagged("ActiveOrder");

export const isEmptyOrder: Predicate.Refinement<Order, EmptyOrder> = Refinement.isTagged("EmptyOrder");

export const isNewActiveItem: Predicate.Refinement<ActiveItem, NewActiveItem> = Refinement.isTagged("NewActiveItem");

export const isExistingActiveItem: Predicate.Refinement<ActiveItem, ExistingActiveItem> = Refinement.isTagged(
  "ExistingActiveItem",
);

export const isMultiOrderItem: Predicate.Refinement<OrderItem, MultiOrderItem> = Refinement.isTagged("MultiOrderItem");

export const getOrderItemAmount = (orderItem: OrderItem) =>
  isMultiOrderItem(orderItem) ? orderItem.amount : Number.Amount(1);

export const getOrderAmount = (order: Order) => (isActiveOrder(order) ? order.totalAmount : 0);
export const getOrderCost = (order: Order) => (isActiveOrder(order) ? order.totalCost : 0);
export const getOrderItems = (order: Order) => isActiveOrder(order) ? order.items : HashMap.empty();
export const getOrderValidity = (order: Order) => isActiveOrder(order) ? order.valid : false;
export const getActiveMenuItem = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? activeItem.item.item : activeItem.item;

export const getActiveAmount = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? getAmount(activeItem.item) : 0;

export const getActiveCost = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? activeItem.item.cost : activeItem.item.price;

export const getActiveValidity = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? activeItem.item.valid : true;

export const getSumAmount = HashMap.reduce(0, (s, c: OrderItem) => s + getAmount(c));

export const toMultiOrderItem = ({ _tag, ...single }: SingleOrderItem, amount: number) =>
  MultiOrderItem({
    ...single,
    amount: Number.Multiple(amount),
  });

const getItemCost = (item: OrderItem) => N.sum(item.item.price, getAllModifiersCost(item.modifiers));

export const getSumCost = HashMap.reduce(0, (accumulated, item: OrderItem) => N.sum(accumulated, item.cost));

export const addEmptyItem = (item: Venue.Menu.MenuItem): Action => (state) => {
  const key = OrderItemKey(nanoid());
  const mods = pipe(
    ReadonlyArray.filterMap(item.modifiers, refineTag("OneOf")),
    ReadonlyArray.map(
      _ =>
        OneOf({
          id: _.id,
          config: Data.struct(_.config),
          amount: Number.Amount(1),
          // TODO: due to some fuckup, this is an index instead of an identifier
          choice: _.config.options[parseInt(_.config.defaultOption, 10)]!.identifier,
        }),
    ),
    ReadonlyArray.map(_ => [_.id, _] as const),
  );

  const valid = pipe(
    ReadonlyArray.filterMap(item.modifiers, refineTag("Extras")),
    ReadonlyArray.every(_ => Option.isNone(_.config.min)),
    Boolean.and(item.price !== 0),
  );

  const orderItem = SingleOrderItem({
    item: Data.struct(item),
    modifiers: HashMap.fromIterable(mods),
    comment: "",
    cost: Number.Cost(item.price),
    valid,
  });
  return State({
    ...state,
    activeItem: valid
      ? pipe(
        Option.filter(state.activeItem, isNewActiveItem),
        Option.filter((active) => active.item.id === item.id),
        Option.map(() => ExistingActiveItem({ item: orderItem, key })),
        Option.orElse(() => state.activeItem),
      )
      : Option.some(ExistingActiveItem({ item: orderItem, key })),
    order: pipe(
      Match.value(state.order),
      Match.tag("EmptyOrder", (_) =>
        ActiveOrder({
          items: HashMap.make([key, orderItem]),
          totalAmount: Number.Amount(1),
          totalCost: orderItem.cost,
          valid,
        })),
      Match.tag("ActiveOrder", (o) =>
        ActiveOrder({
          items: HashMap.set(o.items, key, orderItem),
          totalAmount: Number.Amount(o.totalAmount + 1),
          totalCost: Number.Cost(o.totalCost + orderItem.cost),
          valid: o.valid && valid,
        })),
      Match.exhaustive,
    ),
  });
};

export const addItem = (item: OrderItem): Action => (state) => {
  const key = OrderItemKey(nanoid());

  return State({
    ...state,
    order: pipe(
      Match.value(state.order),
      Match.tag("EmptyOrder", (_) =>
        ActiveOrder({
          items: HashMap.make([key, item]),
          totalAmount: Number.Amount(getAmount(item)),
          totalCost: item.cost,
          valid: item.valid,
        })),
      Match.tag("ActiveOrder", (o) =>
        ActiveOrder({
          items: HashMap.set(o.items, key, item),
          totalAmount: Number.Amount(o.totalAmount + getAmount(item)),
          totalCost: Number.Cost(o.totalCost + item.cost),
          valid: o.valid && item.valid,
        })),
      Match.exhaustive,
    ),
    activeItem: pipe(
      Option.filter(state.activeItem, isNewActiveItem),
      Option.filter((active) => active.item.id === item.item.id),
      Option.map(() => ExistingActiveItem({ item, key })),
      Option.orElse(() => state.activeItem),
    ),
  });
};

const MatchOrder = Match.typeTags<Order>();
const MatchOrderItem = Match.typeTags<OrderItem>();

const incrementOrderItem = MatchOrderItem({
  SingleOrderItem: (_) =>
    MultiOrderItem({
      ..._,
      amount: Number.Multiple(2),
      cost: Number.Cost(_.cost * 2),
      valid: _.valid && _.item.price !== 0,
    }),
  MultiOrderItem: (_) =>
    MultiOrderItem({
      ..._,
      amount: Number.Multiple(_.amount + 1),
      cost: Number.Cost(_.cost / _.amount * (_.amount + 1)),
    }),
});

export const incrementItem = (key: OrderItemKey): Action => (state) =>
  pipe(
    state.order,
    MatchOrder({
      EmptyOrder: () => state,
      ActiveOrder: _ =>
        pipe(
          HashMap.get(_.items, key),
          Option.map((orderItem) => {
            const multiItem = incrementOrderItem(orderItem);
            const becameInvalid = !multiItem.valid && orderItem.valid;
            if (becameInvalid) {
              return State({
                ...state,
                activeItem: Option.some(ExistingActiveItem({ key, item: orderItem })),
              });
            }
            const items = HashMap.set(_.items, key, multiItem);
            return State({
              ...state,
              order: ActiveOrder({
                ..._,
                items,
                totalAmount: Number.Amount(_.totalAmount + 1),
                totalCost: Number.Cost(getSumCost(items)),
              }),
              activeItem: Option.zipWith(state.activeItem, Option.some(multiItem), (active, item) => {
                if (isExistingActiveItem(active) && Equal.equals(active.key, key)) {
                  return ExistingActiveItem({ key, item });
                }

                return active;
              }),
            });
          }),
          Option.getOrElse(() => state),
        ),
    }),
  );

const decrementAmount = (opt: Option.Option<OrderItem>) =>
  pipe(
    Option.filter(opt, isMultiOrderItem),
    Option.map(({ _tag, amount, ...oi }) =>
      amount === 2
        ? SingleOrderItem({ ...oi, cost: Number.Cost(getItemCost({ _tag: "SingleOrderItem", ...oi })) })
        : MultiOrderItem({
          ...oi,
          amount: Number.Multiple(amount - 1),
          cost: Number.Cost(
            N.sum(oi.item.price, getAllModifiersCost(oi.modifiers)) * N.subtract(amount, 1),
          ),
        })
    ),
  );

export const removeItem = (key: OrderItemKey): Action => (state) =>
  pipe(
    Match.value(state.order),
    Match.tag("EmptyOrder", () => state),
    Match.when(isOnlyItem(key), (ord) =>
      State({
        ...state,
        order: EmptyOrder(),
        activeItem: pipe(
          Option.filter(state.activeItem, isExistingActiveItem),
          Option.zipWith(HashMap.get(ord.items, key), (active, orderItem) =>
            Equal.equals(active.item, orderItem)
              ? NewActiveItem({ item: Data.struct(orderItem.item) })
              : active),
          Option.orElse(() => state.activeItem),
        ),
      })),
    Match.tag("ActiveOrder", (o) => {
      const item = HashMap.get(o.items, key);

      const cost = pipe(
        Option.map(item, (it) => it.cost),
        Option.getOrElse(() => 0),
      );

      const amount = Option.match(item, { onNone: () => 0, onSome: getAmount });

      return State({
        ...state,
        order: ActiveOrder({
          ...o,
          items: HashMap.remove(o.items, key),
          totalAmount: Number.Amount(o.totalAmount - amount),
          totalCost: Number.Cost(o.totalCost - cost),
        }),
      });
    }),
    Match.exhaustive,
  );

export const decrementItem = (key: OrderItemKey): Action => (state) => {
  return pipe(
    Match.value(state.order),
    Match.tag("EmptyOrder", () => state),
    Match.when(isLastItem(key), (ord) =>
      State({
        ...state,
        order: EmptyOrder(),
        activeItem: pipe(
          Option.filter(state.activeItem, isExistingActiveItem),
          Option.zipWith(HashMap.get(ord.items, key), (active, orderItem) =>
            Equal.equals(active.item, orderItem)
              ? NewActiveItem({ item: Data.struct(orderItem.item) })
              : active),
          Option.orElse(() => state.activeItem),
        ),
      })),
    Match.tag("ActiveOrder", ({ _tag, ...o }) =>
      Option.match(
        HashMap.get(o.items, key),
        {
          onNone: () => state,
          onSome: (it) =>
            Boolean.match(
              it._tag === "SingleOrderItem",
              {
                onFalse: () =>
                  State({
                    ...state,
                    order: ActiveOrder({
                      ...o,
                      items: HashMap.modifyAt(o.items, key, decrementAmount),
                      totalAmount: Number.Amount(o.totalAmount - 1),
                      totalCost: Number.Cost(o.totalCost - getItemCost(it)),
                    }),
                  }),
                onTrue: () => removeItem(key)(state),
              },
            ),
        },
      )),
    Match.exhaustive,
  );
};

export const updateItem = (hash: OrderItemKey, update: (v: OrderItem) => OrderItem): Action => (state) =>
  pipe(
    state.order,
    Option.liftPredicate(isActiveOrder),
    Option.map((ord) => HashMap.modify(ord.items, hash, update)),
    Option.match({
      onNone: () => state,
      onSome: (items) =>
        State({
          ...state,
          order: ActiveOrder({
            items,
            totalAmount: Number.Amount(getSumAmount(items)),
            totalCost: Number.Cost(getSumCost(items)),
            // PERF: need a 'some' operand
            valid: HashMap.reduce(items, true, (acc, _) => acc && _.valid),
          }),
        }),
    }),
  );

export const setNewActiveItem = (item: Venue.Menu.MenuItem): Action => (state) =>
  State({
    ...state,
    activeItem: Option.some(NewActiveItem({ item: Data.struct(item) })),
  });

export const setExistingActiveItem = (key: OrderItemKey): Action => (state) =>
  State({
    ...state,
    activeItem: pipe(
      state.order,
      Option.liftPredicate(isActiveOrder),
      Option.flatMap((ord) => HashMap.get(ord.items, key)),
      Option.map((item) => ExistingActiveItem({ item, key })),
      Option.orElse(() => state.activeItem),
    ),
  });

export const removeActiveItem = (): Action => (state) =>
  State({
    ...state,
    activeItem: Option.none(),
  });

const reducer = (state: State, action: Action): State => action(state);

export type OrderDispatch = Dispatch<Action>;

export const useOrder = () =>
  useReducer(
    reducer,
    State({ order: EmptyOrder(), activeItem: Option.none() }),
  );
