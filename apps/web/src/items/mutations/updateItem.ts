import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import db, { Prisma } from "db";
import { ModifierConfig } from "shared";
import { UpdateItemPayload } from "src/admin/validations/item-form";
import { Session } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { PrismaError, prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";
import { FullItem, toFullItem } from "../queries/getItemNew";

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
            content: true,
            categoryItems: { select: { id: true, categoryId: true } },
          },
        }),
      (cause) =>
        new PrismaError("Didn't find the specified item within the organization", {
          cause,
          resource: "Item",
        }),
    ));

const encodeRep = Schema.encode(ModifierConfig.Base.ManagementRepresentationSchema);

export default resolver.pipe(
  (i: Schema.From<typeof UpdateItemPayload>) => Schema.decodeEffect(UpdateItemPayload)(i),
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
        content: {
          update: [
            {
              where: { id: item.content.find(_ => _.locale === "en")!.id },
              data: { locale: "en", ...input.content.en },
            },
            {
              where: { id: item.content.find(_ => _.locale === "he")!.id },
              data: { locale: "he", ...input.content.he },
            },
          ],
        },
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
        modifiers: {
          update: pipe(
            input.modifiers,
            A.filter((m) => m.modifierId != null),
            A.map(({ config, modifierId }, p) => ({
              where: { id: modifierId! },
              data: {
                position: p,
                config: {
                  ...config,
                  content: RR.collect(config.content, (locale, _) => ({ locale, ..._ })),
                  options: pipe(
                    // @ts-expect-error
                    config.options,
                    A.map((o, i) => ({
                      ...o,
                      content: RR.collect(o.content, (locale, _) => ({ locale, ..._ })),
                      position: i,
                      managementRepresentation: encodeRep(o.managementRepresentation),
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
            A.map(
              (m, p) => ({
                position: p,
                config: {
                  ...m.config,
                  options: pipe(
                    m.config.options,
                    a =>
                      a.map((o, i) => (
                        m.config._tag === "oneOf"
                          ? {
                            ...o,
                            content: RR.collect(o.content, (locale, _) => ({ locale, ..._ })),
                            position: i,
                            default: m.config.defaultOption === o.identifier,
                            managementRepresentation: encodeRep(o.managementRepresentation),
                          }
                          : {
                            ...o,
                            content: RR.collect(o.content, (locale, _) => ({ locale, ..._ })),
                            position: i,
                            managementRepresentation: encodeRep(o.managementRepresentation),
                          }
                      )),
                  ) as unknown as Prisma.InputJsonValue,
                },
              } satisfies Prisma.ItemModifierCreateWithoutItemInput),
            ),
          ),
        } satisfies Prisma.ItemModifierUncheckedUpdateManyWithoutItemNestedInput,
      } satisfies Prisma.ItemUpdateInput & { id: any })),
      Effect.zipWith(
        Effect.if(
          item.image === input.image,
          Effect.succeed(item.blurHash),
          getBlurHash(input.image!),
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
              data,
            }),
          prismaError("Item"),
        )
      ),
      Effect.tap(() => Effect.log("successfully updated item")),
    )
  ),
  Effect.flatMap(Schema.decodeEffect(toFullItem)),
  Effect.flatMap(Schema.encodeEffect(FullItem)),
  Session.authorizeResolver,
  Renu.runPromise$,
);
