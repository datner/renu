import {
  BaseModifier,
  BaseOption,
  Extras,
  ExtrasOption,
  ModifierEnum,
  OneOf,
  OneOfOption,
} from "db/itemModifierConfig"
import { pipe, tuple, unsafeCoerce } from "fp-ts/function"
import * as NA from "fp-ts/NonEmptyArray"
import * as Id from "fp-ts/Identity"
import * as IO from "fp-ts/IO"
import * as O from "fp-ts/Option"
import * as L from "monocle-ts/Lens"
import * as T from "monocle-ts/Traversal"
import * as I from "monocle-ts/Iso"
import { Locale } from "@prisma/client"

export const baseToOneOfOption = I.iso<BaseOption, OneOfOption>(
  (b) => Object.assign(b, { default: false }),
  ({ default: _, ...b }) => b
)

export const baseToExtrasOption = I.iso<BaseOption, ExtrasOption>(
  (b) => Object.assign(b, { multi: false }),
  ({ multi, ...b }) => b
)

export const extrasToOneOfOption = pipe(I.reverse(baseToExtrasOption), I.compose(baseToOneOfOption))
export const oneOfOptionToExtrasOption = I.reverse(extrasToOneOfOption)

const options = pipe(L.id<BaseModifier>(), L.prop("options"), L.traverse(NA.Traversable))

const changeBaseToOneOfOption = pipe(options, T.modify(baseToOneOfOption.get))
const changeBaseToExtrasOption = pipe(options, T.modify(baseToExtrasOption.get))

export const baseToExtrasModifier = I.iso<BaseModifier, Extras>(
  (base) =>
    pipe(
      base,
      changeBaseToExtrasOption,
      Id.let("_tag", () => ModifierEnum.enum.extras),
      Id.let("max", () => O.none),
      Id.let("min", () => O.none),
      (b) => unsafeCoerce<BaseModifier, Extras>(b)
    ),
  ({ _tag, min, max, options, ...extras }) => ({
    ...extras,
    options: pipe(options, NA.map(baseToExtrasOption.reverseGet)),
  })
)

export const baseToOneOfModifier = I.iso<BaseModifier, OneOf>(
  (base) =>
    pipe(
      base,
      changeBaseToOneOfOption,
      Id.let("_tag", () => ModifierEnum.enum.oneOf),
      (b) => unsafeCoerce<BaseModifier, OneOf>(b)
    ),
  ({ _tag, options, ...oneOf }) => ({
    ...oneOf,
    options: pipe(options, NA.map(baseToOneOfOption.reverseGet)),
  })
)
