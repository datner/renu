import db, { ManagementIntegration, Order } from "db"
import { DorixVendorData } from "integrations/dorix/types"
import { prismaNotFound } from "./prisma"
import { ensureType } from "./zod"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"

const getManagementIntegrationByOrder = ({ venueId }: Order) =>
  TE.tryCatch(
    () => db.managementIntegration.findUniqueOrThrow({ where: { venueId } }),
    prismaNotFound
  )

type UnsupportedManagementError = {
  tag: "UnsupportedManagementError"
  venueId: number
}

const ensureDorix = (mi: ManagementIntegration) =>
  TE.fromPredicate(
    (mi: ManagementIntegration) => mi.provider === "DORIX",
    (): UnsupportedManagementError => ({ tag: "UnsupportedManagementError", venueId: mi.venueId })
  )(mi)

export const getBranchId = (order: Order) =>
  pipe(
    getManagementIntegrationByOrder(order),
    TE.chainW(ensureDorix),
    TE.map((mi) => mi.vendorData),
    TE.chainEitherKW(ensureType(DorixVendorData)),
    TE.map((vd) => vd.branchId)
  )
