import { Prisma } from "database"

export const selectTheEntireMenu = {
  open: true,
  simpleContactInfo: true,
  content: {
    select: {
      locale: true,
      name: true,
    },
  },
  categories: {
    where: { categoryItems: { some: { Item: { deleted: null } } }, deleted: null },
    select: {
      id: true,
      identifier: true,
      content: {
        select: {
          locale: true,
          name: true,
          description: true,
        },
      },
      categoryItems: {
        orderBy: { position: Prisma.SortOrder.asc },
        where: {
          Item: { deleted: null },
        },
        select: {
          position: true,
          Item: {
            select: {
              id: true,
              image: true,
              price: true,
              identifier: true,
              blurDataUrl: true,
              blurHash: true,
              categoryId: true,
              content: {
                select: {
                  locale: true,
                  name: true,
                  description: true,
                },
              },
              modifiers: {
                orderBy: { position: Prisma.SortOrder.asc },
                select: {
                  id: true,
                  position: true,
                  config: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.VenueSelect
const selectMenuItem = selectTheEntireMenu.categories.select.categoryItems.select.Item.select
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> }
export interface EntireMenu
  extends DeepReadonly<Prisma.VenueGetPayload<{ select: typeof selectTheEntireMenu }>> {}

export interface MenuItem
  extends DeepReadonly<Prisma.ItemGetPayload<{ select: typeof selectMenuItem }>> {}
