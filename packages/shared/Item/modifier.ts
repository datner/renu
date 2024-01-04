import * as S from "@effect/schema/Schema";
import { pipe } from "effect";
import * as ModifierConfig from "../modifier-config";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Item from "./item";

export const Id = Common.Id("ItemModifierId");
export type Id = S.Schema.To<typeof Id>;

export const GenericModifier = S.struct({
  id: Id,
  position: Number.NonNegativeInt,
  itemId: Item.Id,
  deleted: S.optionFromNullable(S.DateFromSelf),
  config: ModifierConfig.Schema,
});

export const Modifier = S.union(
  pipe(
    S.struct({
      id: Id,
      position: Number.NonNegativeInt,
      itemId: Item.Id,
      deleted: S.optionFromNullable(S.union(S.Date, S.DateFromSelf)),
      config: ModifierConfig.OneOf.Modifier,
    }),
    S.attachPropertySignature("_tag", "OneOf"),
  ),
  pipe(
    S.struct({
      id: Id,
      position: Number.NonNegativeInt,
      itemId: Item.Id,
      deleted: S.optionFromNullable(S.union(S.Date, S.DateFromSelf)),
      config: ModifierConfig.Extras.Modifier,
    }),
    S.attachPropertySignature("_tag", "Extras"),
  ),
  pipe(
    S.struct({
      id: Id,
      position: Number.NonNegativeInt,
      itemId: Item.Id,
      deleted: S.optionFromNullable(S.union(S.Date, S.DateFromSelf)),
      config: ModifierConfig.Slider.Modifier,
    }),
    S.attachPropertySignature("_tag", "Slider"),
  ),
);

export type Modifier = S.Schema.To<typeof Modifier>;

// export interface Modifier<Config extends ModifierConfig.Schema = ModifierConfig.Schema>
//   extends Omit<S.Schema.To<typeof Modifier>, "config"> {
//   config: Config;
// }

export const isOneOf = <M extends { config: ModifierConfig.Schema }>(
  mod: M,
): mod is M & { config: ModifierConfig.OneOf.OneOf } => mod.config._tag === "oneOf";
export const isExtras = <M extends { config: ModifierConfig.Schema }>(
  mod: M,
): mod is M & { config: ModifierConfig.Extras.Extras } => mod.config._tag === "extras";
export const isSlider = <M extends { config: ModifierConfig.Schema }>(
  mod: M,
): mod is M & { config: ModifierConfig.Slider.Slider } => mod.config._tag === "Slider";

export const fromPrisma = S.compose(
  S.struct({
    id: Id,
    position: S.number,
    itemId: S.number,
    deleted: S.nullable(S.DateFromSelf),
    config: ModifierConfig.FromPrisma,
  }),
  Modifier,
);
