import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import db from "db";
import { UpsertItemPayload } from "src/admin/validations/item-form";
import { Resolver } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { prismaError } from "src/core/helpers/prisma";
import { inspect } from "util";
import { FullItem, toFullItem } from "../queries/getItemNew";

export default resolver.pipe(
  Resolver.schema(UpsertItemPayload),
  Effect.tap((it) => Effect.log("Upserting item " + it.identifier)),
  Resolver.authorize(),
  Resolver.flatMap((input, ctx) =>
    Effect.tryPromise({
      try: () =>
        db.$transaction(async tx => {
          const item = await tx.item.upsert({
            where: {
              organizationId_identifier: {
                identifier: input.identifier,
                organizationId: ctx.session.organization.id,
              },
            },
            update: {
              image: input.image,
              identifier: input.newIdentifier,
              price: input.price,
              category: { connect: { id: input.categoryId } },
            },
            create: {
              image: input.image,
              identifier: input.identifier,
              price: input.price,
              category: { connect: { id: input.categoryId } },
              Venue: { connect: { id: ctx.session.venue.id } },
              organizationId: ctx.session.organization.id,
            },
            include: {
              categoryItems: true,
              content: true,
            },
          });

          const ops = [];

          for (const { locale, description, name } of input.content) {
            const id = item.content.find(_ => _.locale === locale)?.id;
            if (id) {
              ops.push(tx.itemI18L.update({
                where: { id, locale },
                data: { name, description },
              }));
            } else {
              ops.push(tx.itemI18L.create({
                data: { name, description, locale, item: { connect: { id: item.id } } },
              }));
            }
          }

          const categoryItem = item.categoryItems.find(_ => _.categoryId === item.categoryId);
          const menuCategory = await tx.categoryItem.count({ where: { categoryId: item.categoryId } });
          if (categoryItem) {
            ops.push(tx.categoryItem.update({
              where: { id: categoryItem.id },
              data: {
                Category: { connect: { id: item.categoryId } },
              },
            }));
          } else {
            ops.push(tx.categoryItem.create({
              data: {
                Category: { connect: { id: item.categoryId } },
                Item: { connect: { id: item.id } },
                position: menuCategory,
              },
            }));
          }

          // wew, haven't written one of these in years
          for (let i = 0; i < input.modifiers.length; i++) {
            const mod = input.modifiers[i]!;
            let config = {
              ...mod.config,
              options: mod.config.options.map((_, i) => ({
                ..._,
                position: i + 1,
              })),
            };
            if (config._tag === "oneOf") {
              const o = config.defaultOption;
              config.options = config.options.map((_, i) => ({
                ..._,
                default: i === Number(o),
              }));
            }
            if (mod.modifierId) {
              ops.push(tx.itemModifier.update({
                where: { id: mod.modifierId },
                data: {
                  position: i + 1,
                  config,
                },
              }));
            } else {
              ops.push(tx.itemModifier.create({
                data: {
                  position: i + 1,
                  item: { connect: { id: item.id } },
                  config,
                },
              }));
            }
          }

          if (item.image !== input.image) {
            const blurHash = await Renu.runPromise$(getBlurHash(input.image));
            ops.push(tx.item.update({
              where: { id: item.id },
              data: { blurHash },
            }));
          }

          await Promise.all(ops);
          return item;
        }),
      catch: prismaError("Item"),
    })
  ),
  Effect.tapErrorTag("PrismaError", e => Effect.sync(() => console.log(inspect(e.cause)))),
  Effect.tapErrorTag("PrismaError", e => Effect.sync(() => console.log(e.cause))),
  Effect.flatMap(Schema.decode(toFullItem)),
  Effect.flatMap(Schema.encode(FullItem)),
  Effect.catchTag("ParseError", _ => Effect.fail(TreeFormatter.formatErrors(_.errors))),
  Renu.runPromise$,
);
