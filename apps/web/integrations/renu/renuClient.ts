import { constVoid } from "fp-ts/function"
import * as RTE from "fp-ts/ReaderTaskEither"
import { ManagementClient } from "integrations/management/managementClient"

export const renuClient: ManagementClient = {
  reportOrder: () => RTE.fromIO(constVoid),
  getOrderStatus: (order) => RTE.right(order.state),
  getVenueMenu: RTE.of("" as unknown) as unknown as ManagementClient["getVenueMenu"],
}
