import { z } from "zod"
import { Modifier } from "db/itemModifierConfig"
import { pipe, identity, constFalse } from "fp-ts/function"
import * as RR from "fp-ts/ReadonlyRecord"
import * as RA from "fp-ts/ReadonlyArray"
import * as O from "fp-ts/Option"
import { Ord as ordS } from "fp-ts/string"
import { MonoidSum, Ord as ordN } from "fp-ts/number"
import { geq, leq } from "fp-ts/Ord"

export const OneOfItem = z.object({
  identifier: z.string(),
  amount: z.number().int().nonnegative(),
  choice: z.string(),
})

export const ExtrasItem = z.object({
  identifier: z.string(),
  choices: z.record(z.number()),
})

export const ItemForm = z.object({
  amount: z.number().int().nonnegative(),
  comment: z.string(),
  modifiers: z.object({
    oneOf: z.record(OneOfItem),
    extras: z.record(ExtrasItem),
  }),
})

const ordON = O.getOrd(ordN)
const oGeq = geq(ordON)
const oLeq = leq(ordON)

export const getItemFormSchema = (modifiers: Modifier[]) =>
  z.object({
    amount: z.number().int().nonnegative(),
    comment: z.string(),
    modifiers: z.object({
      oneOf: z.record(OneOfItem),
      extras: z.record(
        ExtrasItem.refine(
          (ex) =>
            pipe(
              modifiers,
              RA.findFirst((m) => m.config.identifier === ex.identifier),
              O.chain((m) => (m.config._tag === "extras" ? O.some(m.config) : O.none)),
              O.map((m) =>
                pipe(
                  ex.choices,
                  RR.foldMap(ordS)(MonoidSum)(identity),
                  O.some,
                  (am) => oLeq(m.min, am) && (O.isNone(m.max) || oGeq(m.max, am))
                )
              ),
              O.getOrElse(constFalse)
            ),
          { message: "Please reach minimum!" }
        )
      ),
    }),
  })

export type ItemForm = z.infer<typeof ItemForm>
export type OneOfItem = z.infer<typeof OneOfItem>
export type ExtrasItem = z.infer<typeof ExtrasItem>
