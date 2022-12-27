export interface Identified {
  id?: string
  name: string
}

export interface ManagementModifierOption extends Identified {
  price?: number
}

export interface ManagementModifier extends Identified {
  min?: number
  max?: number
  options: ManagementModifierOption[]
}

export interface ManagementItem extends Identified {
  description: string
  price: number
  modifiers: ManagementModifier[]
}

export interface ManagementCategory extends Identified {
  items: ManagementItem[]
}

export interface ManagementMenu extends Identified {
  categories: ManagementCategory[]
}
