import { item } from "src/items/hooks/form"
import { ItemForm } from "./ItemForm"

type Props = {
  redirect?: boolean
}

export function CreateItemForm(props: Props) {
  const form = item.useCreate(props.redirect)

  return <ItemForm {...form} />
}
