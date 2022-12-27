import { resolver } from "@blitzjs/rpc"
import { GlobalRole } from "@prisma/client"
import { Settings } from "src/admin/validations/settings"
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue"
import db from "db"
import { pipe } from "fp-ts/function"
import * as S from "fp-ts/string"
import * as TE from "fp-ts/TaskEither"
import { prismaNotValid } from "src/core/helpers/prisma"
import { revalidateVenue } from "src/core/helpers/revalidation"

const removeDashes = S.replace("-", "")
const isCell = S.startsWith("05")

const toPhoneNumber = (phone: string) =>
  pipe(phone, removeDashes, (p) =>
    [p.slice(0, isCell(p) ? 3 : 2), "-", p.slice(isCell(p) ? 3 : 2)].join("")
  )

export default resolver.pipe(
  resolver.zod(Settings),
  resolver.authorize([GlobalRole.ADMIN, GlobalRole.SUPER]),
  setDefaultVenue,
  ({ phone, address, venue }) =>
    pipe(
      TE.tryCatch(
        () =>
          db.venue.update({
            where: { id: venue.id },
            data: { simpleContactInfo: `${address} - ${toPhoneNumber(phone)}` },
          }),
        prismaNotValid
      ),
      TE.chainFirstTaskK((v) => revalidateVenue(v.identifier))
    )()
)
