import db from "db"
import { Locale, Prisma } from "database"
import { CreateCategory } from "../validations"
import * as Effect from "@effect/io/Effect"
import * as P from "@effect/schema/Parser"
import { pipe } from "@effect/data/Function"
import { Ctx } from "@blitzjs/next"
import { Session } from "src/auth"
import { prismaError } from "src/core/helpers/prisma"
import { Renu } from "src/core/effect"

export const handler = (input: CreateCategory, ctx: Ctx) =>
  pipe(
    Effect.sync(() => P.decodeOrThrow(CreateCategory)(input)),
    Effect.map(
      ({ identifier, en, he }) =>
        ({
          identifier,
          content: {
            createMany: {
              data: [
                { ...he, locale: Locale.he },
                { ...en, locale: Locale.en },
              ],
            },
          },
        } satisfies Prisma.CategoryCreateInput)
    ),
    Effect.zip(Session.get),
    Effect.flatMap(([input, session]) =>
      Effect.tryCatchPromise(
        () =>
          db.category.create({
            data: {
              ...input,
              Venue: { connect: { id: session.venue.id } },
              organizationId: session.organization.id,
            },
            include: {
              content: true,
            },
          }),
        prismaError("Category")
      )
    ),
    Session.authorize(ctx),
    Renu.runPromise$
  )

export default handler
