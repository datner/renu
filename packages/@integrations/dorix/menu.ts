import * as A from "@fp-ts/data/ReadonlyArray"
import * as O from "@fp-ts/data/Option"
import { pipe } from "@fp-ts/data/Function"
import * as S from "@fp-ts/schema/Schema"
import { parseNumber } from "@fp-ts/schema/data/parser"
import {
  ManagementCategory,
  ManagementItem,
  ManagementMenu,
  ManagementModifier,
  ManagementModifierOption,
} from "@integrations/core/management"

const MangledNumberish = pipe(S.union(S.string, S.number), S.optional)

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
  answerLimit: pipe(S.string, parseNumber, S.nonNaN(), S.finite()),
  items: S.array(DorixAnswer),
})

export const DorixItem = S.struct({
  _id: S.string,
  price: pipe(DorixPrice, S.partial, S.optional),
  name: S.string,
  description: S.option(S.string),
  questions: S.option(
    S.struct({
      mandatory: pipe(DorixQuestion, S.extend(S.struct({ mandatory: S.literal(true) })), S.array),
      optional: pipe(DorixQuestion, S.extend(S.struct({ mandatory: S.literal(false) })), S.array),
    })
  ),
})

type DorixItem = S.Infer<typeof DorixItem>

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
export type DorixMenu = S.Infer<typeof DorixMenu>

export const MenuResponse = S.union(
  S.struct({ ack: S.literal(true), data: S.struct({ menu: DorixMenu }) }),
  S.struct({ ack: S.literal(false), message: pipe(S.string, S.optional) })
)

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
                O.map((q) => A.union(q.mandatory)(q.optional)),
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
                              O.fromNullable(o.price?.inplace),
                              O.map(Number),
                              O.flatMap((n) => (Number.isNaN(n) ? O.none : O.some(n))),
                              O.getOrUndefined
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
