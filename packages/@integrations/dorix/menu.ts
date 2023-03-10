import * as A from "@effect/data/ReadonlyArray"
import * as O from "@effect/data/Option"
import * as E from "@effect/data/Either"
import { pipe } from "@effect/data/Function"
import * as S from "@effect/schema/Schema"
import * as P from "@effect/schema/Parser"
import { parseString } from "@effect/schema/data/Number"
import {
  ManagementCategory,
  ManagementItem,
  ManagementMenu,
  ManagementModifier,
  ManagementModifierOption,
} from "@integrations/core/management"

const MangledNumberish = S.union(parseString(S.string), S.number, S.undefined)

const DorixPrice = S.struct({
  inplace: MangledNumberish,
  ta: MangledNumberish,
  delivery: MangledNumberish,
  pickup: MangledNumberish,
})

const DorixAnswer = S.struct({
  id: S.string,
  name: S.string,
  price: pipe(DorixPrice, S.partial, S.optional),
})

const DorixQuestion = S.struct({
  name: S.string,
  mandatory: S.boolean,
  answerLimit: pipe(S.string, parseString, S.nonNaN(), S.finite()),
  items: S.array(DorixAnswer),
})

export const DorixItem = S.struct({
  _id: S.string,
  price: pipe(DorixPrice, S.partial, S.optional),
  name: S.string,
  description: S.option(S.string),
  questions: S.option(
    S.struct({
      mandatory: pipe(
        DorixQuestion,
        S.omit("mandatory"),
        S.extend(S.struct({ mandatory: S.literal(true) })),
        S.array
      ),
      optional: pipe(
        DorixQuestion,
        S.omit("mandatory"),
        S.extend(S.struct({ mandatory: S.literal(false) })),
        S.array
      ),
    })
  ),
})

export interface DorixItem extends S.Infer<typeof DorixItem> {}

export const DorixCategory = S.struct({
  _id: S.string,
  name: S.string,
  items: S.array(DorixItem),
})
export const DorixMenu = S.struct({
  _id: S.string,
  name: S.string,
  items: S.array(DorixCategory),
})
export interface DorixMenu extends S.Infer<typeof DorixMenu> {}

export const MenuResponse = S.union(
  S.struct({ ack: S.literal(true), data: S.struct({ menu: DorixMenu }) }),
  S.struct({ ack: S.literal(false), message: pipe(S.string, S.optional) })
)

export interface MenuSuccess {
  ack: true
  data: {
    menu: DorixMenu
  }
}
export interface MenuError {
  ack: true
  message?: string
}
export type MenuResponse = MenuSuccess | MenuError

export const toMenu = (dorix: DorixMenu): ManagementMenu => ({
  id: dorix._id,
  name: dorix.name,
  categories: pipe(
    dorix.items,
    A.map(
      (c): ManagementCategory => ({
        id: c._id,
        name: c.name,
        items: pipe(
          c.items,
          A.map(
            (i): ManagementItem => ({
              id: i._id,
              name: i.name,
              description: O.getOrElse(() => "")(i.description),
              price: Number(i.price?.inplace ?? 0),
              modifiers: pipe(
                i.questions,
                O.map((q) => A.appendAll(q.mandatory)(q.optional)),
                O.map(
                  A.map(
                    (m): ManagementModifier => ({
                      name: m.name,
                      max: m.answerLimit,
                      min: m.mandatory ? 1 : undefined,
                      options: pipe(
                        m.items,
                        A.map(
                          (o): ManagementModifierOption => ({
                            id: o.id,
                            name: o.name,
                            price: pipe(
                              o.price?.inplace,
                              P.decode(MangledNumberish),
                              E.getOrUndefined
                            ),
                          })
                        )
                      ),
                    })
                  )
                ),
                O.getOrElse(() => [])
              ),
            })
          )
        ),
      })
    )
  ),
})
