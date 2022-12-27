import { ModifierItem } from "../jotai/order"

export type Updater = (ma: readonly ModifierItem[]) => readonly ModifierItem[]
