import { FieldArrayWithId } from "react-hook-form";
import { ItemFormSchema } from "src/admin/validations/item-form";

export type ModifierField = FieldArrayWithId<ItemFormSchema, "modifiers", "id">;
