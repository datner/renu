import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import * as Optic from "@fp-ts/optic";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { Prisma } from "database";
import db from "db";
import { CreateItem, CreateItemSchema, toCreateItem } from "../validations";
import { pipe } from "@effect/data/Function";
import { z } from "zod";
import * as Parser from "@effect/schema/Parser";
import { PrismaError } from "src/core/helpers/prisma";
import * as Renu from "src/core/effect/runtime";
import * as O from "@effect/data/Option";
import { Session } from "src/auth";

export type CreateItemOutput = z.infer<typeof CreateItem>;
const createDbItem = (data: Prisma.ItemCreateInput) =>
  Effect.attemptCatchPromise(
    () =>
      db.item.create({
        include: { content: true, modifiers: true },
        data,
      }),
    (cause) =>
      new PrismaError("failed to create new item", { cause, resource: "Item" }),
  );

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
  .filter((s): s is Prisma.CategoryItemCreateWithoutItemInput =>
    !Array.isArray(s)
  )
  .at("position");

const setPositionInCategory = <T extends ReturnType<typeof toCreateItem>>(
  input: T,
) =>
  pipe(
    Effect.attemptCatchPromise(
      () =>
        db.categoryItem.count({
          where: {
            Category: {
              id: O.getOrThrow(Optic.getOption(categoryItemConnect)(input)),
            },
          },
        }),
      (cause) =>
        new PrismaError("could not get category item count", {
          cause,
          resource: "CategoryItem",
        }),
    ),
    Effect.map((count) => Optic.replace(categoryItemPosition)(count)(input)),
  );

const createItem = resolver.pipe(
  (i: Schema.From<typeof CreateItemSchema>) => Parser.decodeEffect(CreateItemSchema)(i),
  Effect.map(toCreateItem),
  Effect.bind("blurHash", ({ image }) => getBlurHash(image)),
  Effect.bind("organizationId", () => Effect.map(Session.Organization, o => o.id)),
  Effect.bind("Venue", () => Effect.map(Session.Venue, v => ({ connect: { id: v.id } }))),
  Effect.flatMap(setPositionInCategory),
  Effect.flatMap(createDbItem),
  Session.authorizeResolver,
  Renu.runPromise$,
)

export default createItem;
