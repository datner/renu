import { FieldArrayWithId } from "react-hook-form"
import { ItemSchema } from "../validations"

export type ModifierField = FieldArrayWithId<ItemSchema, "modifiers", "id">
