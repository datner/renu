import { resolver } from "@blitzjs/rpc"
import * as Z from "@effect/io/Effect"
import * as Optic from "@fp-ts/optic"
import { getBlurHash } from "src/core/helpers/plaiceholder"
import db, { Venue } from "db"
import { CreateItem } from "../validations"
import { pipe } from "fp-ts/function"
import { z } from "zod"
import { PrismaError } from "src/core/helpers/prisma"
import { Ctx } from "@blitzjs/next"

export type CreateItemOutput = z.infer<typeof CreateItem>
const createItem = ({
  venue,
  ...data
}: CreateItemOutput & { venue: Venue; blurDataUrl: string | undefined }) =>
  Z.tryCatchPromise(
    () =>
      db.item.create({
        include: { content: true, modifiers: true },
        data: {
          ...data,
          organizationId: venue.organizationId,
          Venue: { connect: { id: venue.id } },
        },
      }),
    (cause) => new PrismaError("failed to create new item", { cause, resource: "Item" })
  )

const create = Optic.id<CreateItemOutput>().at("categoryItems").at("create")

const categoryItemConnect = create.at("Category").at("connect")
const categoryItemPosition = create.at("position")

const setPositionInCategory = <T extends CreateItemOutput>(input: T) =>
  pipe(
    Z.tryCatchPromise(
      () => db.categoryItem.count({ where: { Category: Optic.get(categoryItemConnect)(input) } }),
      (cause) =>
        new PrismaError("could not get category item count", { cause, resource: "CategoryItem" })
    ),
    Z.map((count) => Optic.replace(categoryItemPosition)(count)(input) as T)
  )

export default resolver.pipe(
  resolver.zod(CreateItem),
  resolver.authorize<CreateItemOutput, Ctx>(),
  (input, ctx) =>
    Z.unsafeRunSyncEither(
      pipe(
        Z.succeed(input),
        Z.bind("blurDataUrl", ({ image }) => getBlurHash(image)),
        Z.bindValue("venue", () => ctx.session.venue),
        Z.flatMap(setPositionInCategory),
        Z.flatMap(createItem)
      )
    )
)
