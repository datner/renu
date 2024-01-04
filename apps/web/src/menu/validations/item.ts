import { constFalse, pipe } from "@effect/data/Function";
import { Modifiers } from "database-helpers";
import * as N from "effect/Number";
import * as O from "effect/Option";
import * as RA from "effect/ReadonlyArray";
import * as RR from "effect/ReadonlyRecord";
import { z } from "zod";

export const OneOfItem = z.object({
  identifier: z.string(),
  amount: z.number().int().nonnegative(),
  choice: z.string(),
});

export const ExtrasItem = z.object({
  identifier: z.string(),
  choices: z.record(z.number()),
});

export const ItemForm = z.object({
  amount: z.number().int().nonnegative(),
  comment: z.string(),
  modifiers: z.object({
    oneOf: z.record(OneOfItem),
    extras: z.record(ExtrasItem),
  }),
});

export const getItemFormSchema = (modifiers: Modifiers.ModifierConfig[]) =>
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
              RA.findFirst((m) => m.identifier === ex.identifier),
              O.filter(Modifiers.isExtras),
              O.map((m) =>
                N.between({
                  minimum: O.getOrElse(m.min, () => 0),
                  maximum: O.getOrElse(m.max, () => Infinity),
                })
              ),
              O.ap(
                pipe(
                  RR.collect(ex.choices, (_, a) => a),
                  N.sumAll,
                  O.some,
                ),
              ),
              O.getOrElse(constFalse),
            ),
          { message: "Please reach minimum!" },
        ),
      ),
    }),
  });

export type ItemForm = z.infer<typeof ItemForm>;
export type OneOfItem = z.infer<typeof OneOfItem>;
export type ExtrasItem = z.infer<typeof ExtrasItem>;
