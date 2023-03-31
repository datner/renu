import { Ctx } from "@blitzjs/next";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as P from "@effect/schema/Parser";
import { Locale, Prisma } from "database";
import db from "db";
import { Session } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";
import { CreateCategory } from "../validations";

export const handler = (input: CreateCategory, ctx: Ctx) =>
  pipe(
    P.decodeEffect(CreateCategory)(input),
    Effect.map(
      ({ identifier, en, he }) => ({
        identifier,
        content: {
          createMany: {
            data: [
              { ...he, locale: Locale.he },
              { ...en, locale: Locale.en },
            ],
          },
        },
      } satisfies Prisma.CategoryCreateInput),
    ),
    Effect.zip(Session.Session),
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
        prismaError("Category"),
      )
    ),
    Session.authorize(ctx),
    Renu.runPromise$,
  );

export default handler;
