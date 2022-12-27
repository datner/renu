import { resolver } from "@blitzjs/rpc"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import * as L from "monocle-ts/Lens"
import { getBlurDataUrl } from "src/core/helpers/plaiceholder"
import db, { Venue } from "db"
import { CreateItem } from "../validations"
import { pipe } from "fp-ts/function"
import { z } from "zod"
import { setDefaultOrganizationIdNoFilter } from "src/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "src/core/helpers/revalidation"
import { prismaNotFound, prismaNotValid } from "src/core/helpers/prisma"

export type CreateItemOutput = z.infer<typeof CreateItem>
const createItem = ({
  venue,
  ...data
}: CreateItemOutput & { venue: Venue; blurDataUrl: string | undefined }) =>
  TE.tryCatch(
    () =>
      db.item.create({
        include: { content: true, modifiers: true },
        data: {
          ...data,
          organizationId: venue.organizationId,
          Venue: { connect: { id: venue.id } },
        },
      }),
    prismaNotValid
  )

const catItemPos = pipe(
  L.id<CreateItemOutput>(),
  L.prop("categoryItems"),
  L.prop("create"),
  L.prop("position")
)

const catItemCategory = pipe(
  L.id<CreateItemOutput>(),
  L.prop("categoryItems"),
  L.prop("create"),
  L.prop("Category"),
  L.prop("connect")
)

const setPositionInCategory = <T extends CreateItemOutput>(input: T) =>
  pipe(
    TE.tryCatch(
      () => db.categoryItem.count({ where: { Category: catItemCategory.get(input) } }),
      prismaNotFound
    ),
    TE.map(catItemPos.set),
    TE.ap(TE.of(input)),
    TE.map((a) => a as T)
  )

export default resolver.pipe(
  resolver.zod(CreateItem),
  resolver.authorize(),
  setDefaultOrganizationIdNoFilter,
  setDefaultVenue,
  (input) =>
    pipe(
      T.of(input),
      T.apS("blurDataUrl", () => getBlurDataUrl(input.image)),
      TE.fromTask,
      TE.chain(setPositionInCategory),
      TE.chainW(createItem),
      TE.chainFirstW(() => revalidateVenue(input.venue.identifier))
    )()
)
