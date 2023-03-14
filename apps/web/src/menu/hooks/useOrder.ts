import { Dispatch, useReducer } from "react"
import * as O from "@effect/data/Option"
import * as Match from "@effect/match"
import * as Data from "@effect/data/Data"
import * as Brand from "@effect/data/Brand"
import * as HashMap from "@effect/data/HashMap"
import * as S from "@effect/schema/Schema"
import * as SN from "@effect/schema/data/Number"
import * as Equal from "@effect/data/Equal"
import * as P from "@effect/data/Predicate"
import * as RA from "@effect/data/ReadonlyArray"
import * as N from "@effect/data/Number"
import { pipe, constant } from "@effect/data/Function"
import * as _Menu from "../schema"
import { nanoid } from "nanoid"
import { Modifiers } from "database-helpers"
import { Refinement } from "shared/effect"

export type OrderItemKey = string & Brand.Brand<"OrderItemKey">
export const OrderItemKey = Brand.nominal<OrderItemKey>()

export const Amount = pipe(S.number, S.int(), S.positive(), S.brand("Amount"))
export type Amount = S.Infer<typeof Amount>

export const Multiple = pipe(Amount, S.greaterThan(1), S.brand("Multiple"))
export type Multiple = S.Infer<typeof Multiple>

export const Cost = pipe(S.number, S.int(), S.nonNegative(), SN.multipleOf(50), S.brand("Cost"))
export type Cost = S.Infer<typeof Cost>

export type OrderItemModifierHashMap = HashMap.HashMap<_Menu.ItemModifierId, OrderItemModifier>
export type OrderItemHashMap = HashMap.HashMap<OrderItemKey, OrderItem>

export interface SingleOrderItem extends Data.Case {
  readonly _tag: "SingleOrderItem"
  readonly comment: string
  readonly modifiers: OrderItemModifierHashMap
  readonly item: Data.Data<_Menu.Item>
  readonly cost: Cost
}
export const SingleOrderItem = Data.tagged<SingleOrderItem>("SingleOrderItem")

export interface MultiOrderItem extends Data.Case {
  readonly _tag: "MultiOrderItem"
  readonly amount: Multiple
  readonly comment: string
  readonly modifiers: OrderItemModifierHashMap
  readonly item: Data.Data<_Menu.Item>
  readonly cost: Cost
}
export const MultiOrderItem = Data.tagged<MultiOrderItem>("MultiOrderItem")

export type OrderItem = SingleOrderItem | MultiOrderItem

export interface OneOf extends Data.Case {
  readonly _tag: "OneOf"
  readonly id: _Menu.ItemModifierId
  readonly choice: string
  readonly amount: Amount
  readonly config: Data.Data<Modifiers.OneOf>
}
export const OneOf = Data.tagged<OneOf>("OneOf")

export interface Extras extends Data.Case {
  readonly _tag: "Extras"
  readonly id: _Menu.ItemModifierId
  readonly choices: HashMap.HashMap<string, Amount>
  readonly config: Data.Data<Modifiers.Extras>
}
export const Extras = Data.tagged<Extras>("Extras")
export type OrderItemModifier = OneOf | Extras

export interface ActiveOrder extends Data.Case {
  readonly _tag: "ActiveOrder"
  readonly items: HashMap.HashMap<OrderItemKey, OrderItem>
  readonly totalAmount: Amount
  readonly totalCost: Cost
  // readonly currentItems: Chunk.Chunk<readonly [string, OrderItem]>
}
export const ActiveOrder = Data.tagged<ActiveOrder>("ActiveOrder")

export interface EmptyOrder extends Data.Case {
  readonly _tag: "EmptyOrder"
}
export const EmptyOrder = Data.tagged<EmptyOrder>("EmptyOrder")

export interface NewActiveItem extends Data.Case {
  readonly _tag: "NewActiveItem"
  readonly item: Data.Data<_Menu.Item>
}
export const NewActiveItem = Data.tagged<NewActiveItem>("NewActiveItem")

export interface ExistingActiveItem extends Data.Case {
  readonly _tag: "ExistingActiveItem"
  readonly item: OrderItem
  readonly key: OrderItemKey
}
export const ExistingActiveItem = Data.tagged<ExistingActiveItem>("ExistingActiveItem")

export type ActiveItem = NewActiveItem | ExistingActiveItem

export type Order = ActiveOrder | EmptyOrder

export interface State extends Data.Case {
  readonly _tag: "State"
  readonly order: Order
  readonly activeItem: O.Option<ActiveItem>
}
export const State = Data.tagged<State>("State")

type Action = (state: State) => State

const getOneOfCost = (oneOf: OneOf) =>
  pipe(
    RA.findFirst(oneOf.config.options, (o) => o.identifier === oneOf.choice),
    O.map((o) => o.price * oneOf.amount),
    O.getOrElse(() => 0)
  )

const getExtrasCost = (extras: Extras) => {
  return O.sumCompact(
    RA.map(extras.config.options, (o) =>
      O.map(HashMap.get(extras.choices, o.identifier), (amount) => o.price * (o.multi ? amount : 1))
    )
  )
}

const getModifierCost = pipe(
  Match.type<OrderItemModifier>(),
  Match.tag("OneOf", (o) => getOneOfCost(o)), // TODO: this is a bug with Match :(
  Match.tag("Extras", getExtrasCost),
  Match.exhaustive
)

const getAllModifiersCost = (modsMap: OrderItemModifierHashMap) =>
  pipe(modsMap, HashMap.map(getModifierCost), HashMap.values, N.sumAll)

export const getAmount = pipe(
  Match.type<OrderItem>(),
  Match.tag("SingleOrderItem", () => 1),
  Match.tag("MultiOrderItem", (o) => o.amount as number),
  Match.exhaustive
)

export const getOrderAmount = (order: Order) => (isActiveOrder(order) ? order.totalAmount : 0)
export const getOrderCost = (order: Order) => (isActiveOrder(order) ? order.totalCost : 0)
export const getOrderItems = (order: Order) =>
  isActiveOrder(order) ? order.items : HashMap.empty()
export const getActiveMenuItem = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? activeItem.item.item : activeItem.item

export const getActiveAmount = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? getAmount(activeItem.item) : 0

export const getActiveCost = (activeItem: ActiveItem) =>
  isExistingActiveItem(activeItem) ? activeItem.item.cost : activeItem.item.price

export const getSumAmount = HashMap.reduce(0, (s, c: OrderItem) => s + getAmount(c))

export const toMultiOrderItem = ({ _tag, ...single }: SingleOrderItem, amount: number) =>
  MultiOrderItem({
    ...single,
    amount: Multiple(amount),
  })

const getSingleItemCost = (item: OrderItem) =>
  N.sum(item.item.price, getAllModifiersCost(item.modifiers))

export const getSumCost = HashMap.reduce(0, (accumulated, item: OrderItem) =>
  N.sum(accumulated, item.cost)
)

export const addEmptyItem =
  (item: _Menu.Item): Action =>
  (state) => {
    const key = OrderItemKey(nanoid())
    const orderItem = SingleOrderItem({
      item: Data.struct(item),
      modifiers: HashMap.empty(),
      comment: "",
      cost: Cost(item.price),
    })
    return State({
      ...state,
      activeItem: pipe(
        O.filter(state.activeItem, isNewActiveItem),
        O.filter((active) => active.item.id === item.id),
        O.map(() => ExistingActiveItem({ item: orderItem, key })),
        O.orElse(() => state.activeItem)
      ),
      order: pipe(
        Match.value(state.order),
        Match.tag("EmptyOrder", (_) =>
          ActiveOrder({
            items: HashMap.make([key, orderItem]),
            totalAmount: Amount(1),
            totalCost: orderItem.cost,
          })
        ),
        Match.tag("ActiveOrder", (o) =>
          ActiveOrder({
            items: HashMap.set(o.items, key, orderItem),
            totalAmount: Amount(o.totalAmount + 1),
            totalCost: Cost(o.totalCost + orderItem.cost),
          })
        ),
        Match.exhaustive
      ),
    })
  }

export const addItem =
  (item: OrderItem): Action =>
  (state) => {
    const key = OrderItemKey(nanoid())

    return State({
      ...state,
      order: pipe(
        Match.value(state.order),
        Match.tag("EmptyOrder", (_) =>
          ActiveOrder({
            items: HashMap.make([key, item]),
            totalAmount: Amount(getAmount(item)),
            totalCost: item.cost,
          })
        ),
        Match.tag("ActiveOrder", (o) =>
          ActiveOrder({
            items: HashMap.set(o.items, key, item),
            totalAmount: Amount(o.totalAmount + getAmount(item)),
            totalCost: Cost(o.totalCost + item.cost),
          })
        ),
        Match.exhaustive
      ),
      activeItem: pipe(
        O.filter(state.activeItem, isNewActiveItem),
        O.filter((active) => active.item.id === item.item.id),
        O.map(() => ExistingActiveItem({ item, key })),
        O.orElse(() => state.activeItem)
      ),
    })
  }

export const incrementItem =
  (key: OrderItemKey): Action =>
  (state) =>
    pipe(
      Match.value(state.order),
      Match.tag("EmptyOrder", () => state),
      Match.tag("ActiveOrder", (o) =>
        pipe(
          HashMap.get(o.items, key),
          O.map((it) => {
            const amount = pipe(
              Match.value(it),
              Match.tag("SingleOrderItem", () => Multiple(2)),
              Match.tag("MultiOrderItem", (oi) => Multiple(oi.amount + 1)),
              Match.exhaustive
            )
            return MultiOrderItem({
              comment: it.comment,
              item: it.item,
              modifiers: it.modifiers,
              amount,
              cost: Cost(getSingleItemCost(it) * amount),
            })
          }),
          O.map((multiItem) => {
            const items = HashMap.set(o.items, key, multiItem)
            return State({
              ...state,
              order: ActiveOrder({
                ...o,
                items,
                totalAmount: Amount(getAmount(multiItem)),
                totalCost: Cost(getSumCost(items)),
              }),
              activeItem: O.zipWith(state.activeItem, O.some(multiItem), (active, item) => {
                if (isExistingActiveItem(active) && Equal.equals(active.key, key))
                  return ExistingActiveItem({ key, item })

                return active
              }),
            })
          }),
          O.getOrElse(() => state)
        )
      ),
      Match.exhaustive
    )

const isOnlyItem = (key: OrderItemKey) =>
  P.every([
    (o: ActiveOrder) => HashMap.has(o.items, key),
    (o: ActiveOrder) => HashMap.size(o.items) === 1,
  ])

const isLastItem = (key: OrderItemKey) =>
  P.and(isOnlyItem(key), (o: ActiveOrder) => o.totalAmount === 1)

export const isOneOf: P.Refinement<OrderItemModifier, OneOf> = Refinement.isTagged("OneOf")

export const isExtras: P.Refinement<OrderItemModifier, Extras> = Refinement.isTagged("Extras")

export const isActiveOrder: P.Refinement<Order, ActiveOrder> = Refinement.isTagged("ActiveOrder")

export const isEmptyOrder: P.Refinement<Order, EmptyOrder> = Refinement.isTagged("EmptyOrder")

export const isNewActiveItem: P.Refinement<ActiveItem, NewActiveItem> =
  Refinement.isTagged("NewActiveItem")

export const isExistingActiveItem: P.Refinement<ActiveItem, ExistingActiveItem> =
  Refinement.isTagged("ExistingActiveItem")

export const isMultiOrderItem: P.Refinement<OrderItem, MultiOrderItem> =
  Refinement.isTagged("MultiOrderItem")

const decrementAmount = (opt: O.Option<OrderItem>) =>
  pipe(
    O.filter(opt, isMultiOrderItem),
    O.map(({ _tag, amount, ...oi }) =>
      amount <= 2
        ? SingleOrderItem({ ...oi, cost: Cost(getSingleItemCost({ _tag, amount, ...oi })) })
        : MultiOrderItem({
            ...oi,
            amount: Multiple(amount - 1),
            cost: Cost(
              N.sum(oi.item.price, getAllModifiersCost(oi.modifiers)) * N.subtract(amount, 1)
            ),
          })
    )
  )

export const removeItem =
  (key: OrderItemKey): Action =>
  (state) =>
    pipe(
      Match.value(state.order),
      Match.tag("EmptyOrder", () => state),
      Match.when(isOnlyItem(key), (ord) =>
        State({
          ...state,
          order: EmptyOrder({} as unknown as void),
          activeItem: pipe(
            O.filter(state.activeItem, isExistingActiveItem),
            O.zipWith(HashMap.get(ord.items, key), (active, orderItem) =>
              Equal.equals(active.item, orderItem)
                ? NewActiveItem({ item: Data.struct(orderItem.item) })
                : active
            ),
            O.orElse(() => state.activeItem)
          ),
        })
      ),
      Match.tag("ActiveOrder", (o) => {
        const item = HashMap.get(o.items, key)

        const cost = pipe(
          O.map(item, (it) => it.cost),
          O.getOrElse(() => 0)
        )

        const amount = O.match(item, () => 0, getAmount)

        return State({
          ...state,
          order: ActiveOrder({
            ...o,
            items: HashMap.remove(o.items, key),
            totalAmount: Multiple(o.totalAmount - amount),
            totalCost: Cost(o.totalCost - cost),
          }),
        })
      }),
      Match.exhaustive
    )

export const decrementItem =
  (key: OrderItemKey): Action =>
  (state) =>
    pipe(
      Match.value(state.order),
      Match.tag("EmptyOrder", () => state),
      Match.when(isLastItem(key), (ord) => {
        return State({
          ...state,
          order: EmptyOrder({} as unknown as void),
          activeItem: pipe(
            O.filter(state.activeItem, isExistingActiveItem),
            O.zipWith(HashMap.get(ord.items, key), (active, orderItem) =>
              Equal.equals(active.item, orderItem)
                ? NewActiveItem({ item: Data.struct(orderItem.item) })
                : active
            ),
            O.orElse(() => state.activeItem)
          ),
        })
      }),
      Match.tag("ActiveOrder", ({ _tag, ...o }) => {
        const item = HashMap.get(o.items, key)

        const cost = O.match(item, constant(0), getSingleItemCost)

        const amount = O.match(item, constant(0), constant(1))

        return State({
          ...state,
          order: ActiveOrder({
            ...o,
            items: HashMap.modifyAt(o.items, key, decrementAmount),
            totalAmount: Amount(o.totalAmount - amount),
            totalCost: Cost(o.totalCost - cost),
          }),
        })
      }),
      Match.exhaustive
    )

export const updateItem =
  (hash: OrderItemKey, update: (v: OrderItem) => OrderItem): Action =>
  (state) =>
    pipe(
      state.order,
      O.liftPredicate(isActiveOrder),
      O.map((ord) => {
        const items = HashMap.modify(ord.items, hash, update)

        return State({
          ...state,
          order: ActiveOrder({
            items,
            totalAmount: Amount(getSumAmount(items)),
            totalCost: Cost(getSumCost(items)),
          }),
        })
      }),
      O.getOrElse(() => state)
    )

export const setNewActiveItem =
  (item: _Menu.Item): Action =>
  (state) =>
    State({
      ...state,
      activeItem: O.some(NewActiveItem({ item: Data.struct(item) })),
    })

export const setExistingActiveItem =
  (key: OrderItemKey): Action =>
  (state) =>
    State({
      ...state,
      activeItem: pipe(
        state.order,
        O.liftPredicate(isActiveOrder),
        O.flatMap((ord) => HashMap.get(ord.items, key)),
        O.map((item) => ExistingActiveItem({ item, key })),
        O.orElse(() => state.activeItem)
      ),
    })

export const removeActiveItem = (): Action => (state) =>
  State({
    ...state,
    activeItem: O.none(),
  })

const reducer = (state: State, action: Action): State => action(state)

export type OrderDispatch = Dispatch<Action>

export const useOrder = () => {
  return useReducer(
    reducer,
    State({ order: EmptyOrder({} as unknown as void), activeItem: O.none() })
  )
}
