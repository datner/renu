import { Item, OrderItem } from "db"
import * as A from "fp-ts/Array"
import { PaymentItemInput } from "./types"
import { divide } from "src/core/helpers/number"

export const toItems = A.map<OrderItem & { item: Item }, PaymentItemInput>(
  ({ price, quantity, name, item, comment }) => ({
    price: divide(100)(price),
    quantity,
    name,
    image_url: item.image,
    product_invoice_extra_details: comment,
  })
)
