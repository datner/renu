import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import * as S from "@effect/schema/Schema"
import {Number, Common} from 'shared/schema'
import { ManagementIntegration, ManagementProvider, OrderState, Order, Prisma } from "database"
import { pipe } from "@effect/data/Function"

export const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude

export type FullOrderWithItems = Prisma.OrderGetPayload<{
  include: typeof fullOrderInclude
}>

export const Integration = S.struct({
  id: S.number,
  venueId: S.number,
  provider: S.enums(ManagementProvider),
  vendorData: S.json,
})

export class ManagementError extends Error {
  readonly _tag = "ManagementError"
}

export const FullOrderService = Context.Tag<FullOrderWithItems>()
export const IntegrationSettingsService = Context.Tag<ManagementIntegration>()

export interface ManagementService {
  reportOrder: (
    order: FullOrderWithItems
  ) => Effect.Effect<ManagementIntegration, ManagementError, void>

  getOrderStatus: (
    order: Order
  ) => Effect.Effect<ManagementIntegration, ManagementError, OrderState>

  getVenueMenu: Effect.Effect<ManagementIntegration, ManagementError, ManagementMenu>
}
export const ManagementService = Context.Tag<ManagementService>()

export interface Identified {
  id?: string
  name: string
}

  
export const Name = pipe(S.string, S.brand('@integration/management/menu/Name'))
export type Name = S.To<typeof Name>

export const ModifierOptionId = Common.ForeignId('@integration/management/menu/ModifierOptionId')
export type ModifierOptionId = S.To<typeof ModifierOptionId>

export const ModifierId = Common.ForeignId('@integration/management/menu/ModifierId')
export type ModifierId = S.To<typeof ModifierId>

export const ItemId = Common.ForeignId('@integration/management/menu/ItemId')
export type ItemId = S.To<typeof ItemId>

export const CategoryId = Common.ForeignId('@integration/management/menu/CategoryId')
export type CategoryId = S.To<typeof CategoryId>

export const MenuId = Common.ForeignId('@integration/management/menu/MenuId')
export type MenuId = S.To<typeof MenuId>

export const Identified = <B extends S.BrandSchema<any, any>>(Id: B) => pipe(
  S.struct({ name: Name }),
  S.optionsFromOptionals({id: Id}))

export const ModifierOption = pipe(
  Identified(ModifierOptionId),
  S.optionsFromOptionals({
    price: Number.Price
  })
)
export interface ModifierOption extends S.To<typeof ModifierOption> {}

export const Modifier = pipe(
  S.struct({
    options: S.array(ModifierOption)
  }),
  S.optionsFromOptionals({
    min: Number.Amount,
    max: Number.Amount
  }),
  S.extend(Identified(ModifierId)),
)
export interface Modifier extends S.To<typeof Modifier> {}

export const Item = pipe(
  S.struct({
    description: S.string,
    price: Number.Price,
    modifiers: S.array(Modifier)
  }),
  S.extend(Identified(ItemId)),
)
export interface Item extends S.To<typeof Item> {}

export const Category = pipe(
  S.struct({
    items: S.array(Item)
  }),
  S.extend(Identified(CategoryId)),
)
export interface Category extends S.To<typeof Category> {}

export const Menu = pipe(
  S.struct({
    categories: S.array(Category)
  }),
  S.extend(Identified(MenuId)),
)
export interface Menu extends S.To<typeof Menu> {}

export interface ManagementModifierOption extends Identified {
  price?: number
}

export interface ManagementModifier extends Identified {
  min?: number
  max?: number
  options: ManagementModifierOption[]
}

export interface ManagementItem extends Identified {
  description: string
  price: number
  modifiers: ManagementModifier[]
}

export interface ManagementCategory extends Identified {
  items: ManagementItem[]
}

export interface ManagementMenu extends Identified {
  categories: ManagementCategory[]
}
