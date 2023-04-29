import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import db, { Prisma } from "db";
import { Session } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { PrismaError, prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";
import { Modifier } from "../validations";
import { UpdateItemSchema } from "../validations";

const getItem = (id: number) =>
  Effect.flatMap(Session.Organization, (org) =>
    Effect.tryCatchPromise(
      () =>
        db.item.findFirstOrThrow({
          where: { id, organizationId: org.id },
          select: {
            image: true,
            blurHash: true,
            categoryId: true,
            categoryItems: { select: { id: true, categoryId: true } },
          },
        }),
      (cause) =>
        new PrismaError("Didn't find the specified item within the organization", {
          cause,
          resource: "Item",
        }),
    ));

export default resolver.pipe(
  (i: Schema.From<typeof UpdateItemSchema>) => Schema.decodeEffect(UpdateItemSchema)(i),
  Effect.tap((it) => Effect.log("getting item with id " + it.id)),
  Effect.flatMap(i => Effect.all(Effect.succeed(i), getItem(i.id))),
  Effect.flatMap(([input, item]) =>
    pipe(
      Effect.sync(() => ({
        id: input.id,
        image: input.image,
        identifier: input.identifier,
        price: input.price,
        category: { connect: { id: input.categoryId } },
        categoryItems: pipe(
          A.findFirst(
            item.categoryItems,
            (ci) => ci.categoryId === item.categoryId,
          ),
          O.map(
            (catItem) => ({
              update: {
                where: {
                  id: catItem.id,
                },
                data: {
                  Category: { connect: { id: input.categoryId } },
                  position: 100,
                },
              },
            } satisfies Prisma.CategoryItemUpdateManyWithoutItemNestedInput),
          ),
          O.getOrUndefined,
        ),
        managementRepresentation: { id: input.managementId },
        modifiers: {
          update: pipe(
            input.modifiers,
            A.filter((m) => m.modifierId != null),
            A.map(({ config, modifierId, managementId }, p) => ({
              where: { id: modifierId! },
              data: {
                managementRepresentation: { id: managementId },
                position: p,
                config: {
                  ...config,
                  options: pipe(
                    // @ts-expect-error what do they want
                    config.options,
                    A.map((o, i) => ({
                      ...o,
                      position: i,
                    })),
                    A.map((o, i) =>
                      config._tag === "oneOf"
                        ? {
                          ...o,
                          default: config.defaultOption === String(i),
                        }
                        : o
                    ),
                  ),
                } as any,
              },
            })),
          ),
          create: pipe(
            input.modifiers,
            A.filter((m) => m.modifierId == null),
            A.map(m => Schema.encode(Modifier)(m)),
            A.map(
              (m, p) => ({
                position: p,
                managementRepresentation: { id: m.managementId },
                config: {
                  ...m.config,
                  options: pipe(
                    m.config.options,
                    a =>
                      a.map((o, i) => (
                        m.config._tag === "oneOf"
                          ? {
                            ...o,
                            position: i,
                            default: m.config.defaultOption === o.identifier,
                          }
                          : {
                            ...o,
                            position: i,
                          }
                      )),
                  ) as unknown as Prisma.JsonValue,
                },
              } satisfies Prisma.ItemModifierCreateWithoutItemInput),
            ),
          ),
        } satisfies Prisma.ItemModifierUncheckedUpdateManyWithoutItemNestedInput,
      })),
      Effect.zipWith(
        Effect.ifEffect(
          Effect.succeed(item.image === input.image),
          Effect.succeed(item.blurHash),
          getBlurHash(input.image),
        ),
        (data, blurHash) => ({ ...data, blurHash }),
      ),
      Effect.tap(() => Effect.log("updating item with following body")),
      Effect.tap((body) => Effect.sync(() => console.log(inspect(body, false, null, true)))),
      Effect.flatMap(({ id, ...data }) =>
        Effect.tryCatchPromise(
          () =>
            db.item.update({
              where: { id },
              include: { content: true, modifiers: { where: { deleted: null } } },
              data,
            }),
          prismaError("Item"),
        )
      ),
      Effect.map(a => a),
      Effect.tap(() => Effect.log("successfully updated item")),
    )
  ),
  Effect.map(a => a),
  Session.authorizeResolver,
  Renu.runPromise$,
);
