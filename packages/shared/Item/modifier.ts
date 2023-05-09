import { identity, pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import * as ModifierConfig from "../modifier-config";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Item from "./item";

export const Id = Common.Id("ItemModifierId");
export type Id = S.To<typeof Id>;

export const GenericModifier = S.struct({
  id: Id,
  position: Number.NonNegativeInt,
  itemId: Item.Id,
  deleted: S.optionFromNullable(S.DateFromSelf),
  config: ModifierConfig.Schema,
});

const shape = S.getPropertySignatures(GenericModifier);

export const Modifier = S.union(
  pipe(
    S.struct({ ...shape, config: Common.fromPrisma(ModifierConfig.OneOf.Modifier) }),
    S.attachPropertySignature("_tag", "OneOf"),
  ),
  pipe(
    S.struct({ ...shape, config: Common.fromPrisma(ModifierConfig.Extras.Modifier) }),
    S.attachPropertySignature("_tag", "Extras"),
  ),
  pipe(
    S.struct({ ...shape, config: Common.fromPrisma(ModifierConfig.Slider.Modifier) }),
    S.attachPropertySignature("_tag", "Slider"),
  ),
);

export const Update = S.union(
  pipe(
    S.struct({ ...shape, config: Common.fromPrisma(ModifierConfig.OneOf.Modifier) }),
    S.partial,
    S.attachPropertySignature("_tag", "OneOf"),
  ),
  pipe(
    S.struct({ ...shape, config: Common.fromPrisma(ModifierConfig.Extras.Modifier) }),
    S.partial,
    S.attachPropertySignature("_tag", "Extras"),
  ),
  pipe(
    S.struct({ ...shape, config: Common.fromPrisma(ModifierConfig.Slider.Modifier) }),
    S.partial,
    S.attachPropertySignature("_tag", "Slider"),
  ),
);

export type Modifier = S.To<typeof Modifier>

// export interface Modifier<Config extends ModifierConfig.Schema = ModifierConfig.Schema>
//   extends Omit<S.To<typeof Modifier>, "config"> {
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

export const fromPrisma = pipe(
  S.from(S.struct({
    id: Id,
    position: Number.NonNegativeInt,
    itemId: Item.Id,
    deleted: S.optionFromNullable(S.DateFromSelf),
    config: Common.fromPrisma(ModifierConfig.Schema),
  })),
  S.transform(Modifier, identity, identity),
);
