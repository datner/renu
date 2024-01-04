import { Schema } from "@effect/schema";
import { FieldArrayWithId } from "react-hook-form";
import { Item } from "shared";
import { Common } from "shared/schema";
import { ItemFormSchema } from "src/admin/validations/item-form";

export type ModifierField = FieldArrayWithId<ItemFormSchema, "modifiers", "id">;

export class FullItem extends Item.Item.extend<FullItem>()({
  content: Schema.array(Common.Content),
  modifiers: Schema.array(Item.Modifier.fromPrisma),
}) {}
