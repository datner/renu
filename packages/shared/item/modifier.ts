import * as S from "@effect/schema/Schema";
import * as ModifierConfig from "../modifier-config";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Item from "./item";

export const Id = Common.Id("ItemModifierId");
export type Id = S.To<typeof Id>;

export const Modifier = S.struct({
  id: Id,
  position: Number.NonNegativeInt,
  itemId: Item.Id,
  deleted: S.optionFromNullable(S.DateFromSelf),
  config: ModifierConfig.Schema,
});

export interface Modifier<Config extends ModifierConfig.Schema = ModifierConfig.Schema>
  extends Omit<S.To<typeof Modifier>, "config">
{
  config: Config;
}

export const isOneOf = <M extends { config: ModifierConfig.Schema }>(
  mod: M,
): mod is M & { config: ModifierConfig.OneOf.OneOf } => mod.config._tag === "oneOf";
export const isExtras = <M extends { config: ModifierConfig.Schema }>(
  mod: M,
): mod is M & { config: ModifierConfig.Extras.Extras } => mod.config._tag === "extras";
export const isSlider = <M extends { config: ModifierConfig.Schema }>(
  mod: M,
): mod is M & { config: ModifierConfig.Slider.Slider } => mod.config._tag === "Slider";

export const fromPrisma = S.struct({
  id: Id,
  position: Number.NonNegativeInt,
  itemId: Item.Id,
  deleted: S.optionFromNullable(S.DateFromSelf),
  config: ModifierConfig.FromPrisma,
});
