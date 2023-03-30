import * as S from "@effect/schema/Schema";
import * as ModifierConfig from "../modifier-config";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Item from "./item";

export const Id = Common.Id("ItemModifierId");
export type Id = S.To<typeof Id>;

export const Schema = S.struct({
  id: Id,
  position: Number.NonNegativeInt,
  itemId: Item.Id,
  deleted: S.optionFromNullable(S.date),
  config: ModifierConfig.Schema,
  managementRepresentation: S.json,
});
