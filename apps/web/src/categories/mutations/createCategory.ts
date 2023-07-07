import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import { Prisma } from "database";
import { Database } from "shared/Database";
import { Resolver } from "src/auth";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";
import { CreateCategory } from "../validations";

export const handler = resolver.pipe(
  Resolver.schema(CreateCategory),
  Resolver.authorize(),
  Effect.map(
    ({ identifier, en, he }) => ({
      identifier,
      content: {
        createMany: {
          data: [he, en],
        },
      },
    } satisfies Prisma.CategoryCreateInput),
  ),
  Resolver.flatMapAuthorized((data, { session }) =>
    Effect.flatMap(Database, db =>
      Effect.tryPromise({
        try: () =>
          db.category.create({
            data: {
              ...data,
              Venue: { connect: { id: session.venue.id } },
              organizationId: session.organization.id,
            },
            include: {
              content: true,
            },
          }),
        catch: prismaError("Category"),
      }))
  ),
  Renu.runPromise$,
);

export default handler;
