import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import * as Optic from "@fp-ts/optic";
import { Prisma } from "database";
import db from "db";
import { Resolver, Session } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { PrismaError } from "src/core/helpers/prisma";
import { z } from "zod";
import { CreateItem, CreateItemSchema, toCreateItem } from "../validations";

export type CreateItemOutput = z.infer<typeof CreateItem>;
const createDbItem = (data: Prisma.ItemCreateInput) =>
  Effect.tryPromise({
    try: () =>
      db.item.create({
        include: { content: true, modifiers: true },
        data,
      }),
    catch: (cause) => new PrismaError("failed to create new item", { cause, resource: "Item" }),
  });

const input_ = Optic.id<Prisma.ItemCreateInput>();

const categoryItemConnect = input_
  .at("category")
  .nonNullable()
  .at("connect")
  .nonNullable()
  .at("id")
  .nonNullable();

const categoryItemPosition = input_
  .at("categoryItems")
  .nonNullable()
  .at("create")
  .nonNullable()
  .filter((s): s is Prisma.CategoryItemCreateWithoutItemInput => !Array.isArray(s))
  .at("position");

const setPositionInCategory = <T extends ReturnType<typeof toCreateItem>>(
  input: T,
) =>
  pipe(
    Effect.tryPromise({
      try: () =>
        db.categoryItem.count({
          where: {
            Category: {
              id: O.getOrThrow(Optic.getOption(categoryItemConnect)(input)),
            },
          },
        }),
      catch: (cause) =>
        new PrismaError("could not get category item count", {
          cause,
          resource: "CategoryItem",
        }),
    }),
    Effect.map((count) => Optic.replace(categoryItemPosition)(count)(input)),
  );

const createItem = resolver.pipe(
  Resolver.schema(CreateItemSchema),
  Effect.map(toCreateItem),
  Effect.bind("blurHash", ({ image }) => getBlurHash(image)),
  Effect.bind("organizationId", () => Effect.map(Session.Organization, o => o.id)),
  Effect.bind("Venue", () => Effect.map(Session.Venue, v => ({ connect: { id: v.id } }))),
  Effect.flatMap(setPositionInCategory),
  Effect.flatMap(createDbItem),
  Session.authorizeResolver,
  Effect.catchTag("ParseError", _ => Effect.fail(TreeFormatter.formatErrors(_.errors))),
  Renu.runPromise$,
);

export default createItem;
