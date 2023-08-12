import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import * as TreeFormatter from "@effect/schema/TreeFormatter";
import db, { Organization } from "db";
import { UpdateItemPayload } from "src/admin/validations/item-form";
import { Resolver } from "src/auth";
import * as Renu from "src/core/effect/runtime";
import { getBlurHash } from "src/core/helpers/plaiceholder";
import { prismaError } from "src/core/helpers/prisma";
import { FullItem, toFullItem } from "../queries/getItemNew";

export default resolver.pipe(
  Resolver.schema(UpdateItemPayload),
  Effect.tap((it) => Effect.log("getting item with id " + it.id)),
  Resolver.authorize(),
  Resolver.flatMap((input, ctx) =>
    Effect.tryPromise({
      try: () =>
        db.$transaction(async tx => {
          const item = await tx.item.upsert({
            where: { id: input.id, venueId: ctx.session.venue.id },
            update: {
              image: input.image,
              identifier: input.identifier,
              price: input.price,
              category: { connect: { id: input.categoryId } },
            },
            create: {
              image: input.image,
              identifier: input.identifier,
              price: input.price,
              category: { connect: { id: input.categoryId } },
            },
            include: {
              categoryItems: true,
              content: true,
            },
          });

          const ops = [];

          for (const { locale, description, name } of input.content) {
            const id = item.content.find(_ => _.locale === locale)?.id;
            ops.push(tx.itemI18L.upsert({
              where: { id, locale },
              create: { name, description, locale, item: { connect: { id: input.id } } },
              update: { name, description },
            }));
          }

          const categoryItem = item.categoryItems.find(_ => _.categoryId === item.categoryId);
          if (categoryItem) {
            const menuCategory = await tx.categoryItem.count({ where: { categoryId: item.categoryId } });
            ops.push(tx.categoryItem.upsert({
              where: { id: categoryItem.id },
              update: {
                Category: { connect: { id: input.categoryId } },
              },
              create: {
                Category: { connect: { id: input.categoryId } },
                Item: { connect: { id: input.id } },
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
            ops.push(tx.itemModifier.upsert({
              where: { id: mod.modifierId },
              update: {
                position: i + 1,
                config,
              },
              create: {
                position: i + 1,
                item: { connect: { id: input.id } },
                config,
              },
            }));
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
  Effect.flatMap(Schema.decode(toFullItem)),
  Effect.flatMap(Schema.encode(FullItem)),
  Effect.catchTag("ParseError", _ => Effect.fail(TreeFormatter.formatErrors(_.errors))),
  Renu.runPromise$,
);
