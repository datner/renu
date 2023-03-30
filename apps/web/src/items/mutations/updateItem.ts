import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"
import * as A from "@effect/data/ReadonlyArray"
import * as O from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import { OptionsSchemaArray, UpdateItem } from "../validations"
import { PrismaError } from "src/core/helpers/prisma"
import { AuthenticatedSessionContext } from "@blitzjs/auth"
import { getBlurHash } from "src/core/helpers/plaiceholder"
import * as Renu from "src/core/effect/runtime"

const AuthSessionContext = Context.Tag<AuthenticatedSessionContext>()

const getItem = (id: number) =>
  pipe(
    AuthSessionContext,
    Effect.map((s) => s.organization.id),
    Effect.flatMap((organizationId) =>
      Effect.attemptCatchPromise(
        () =>
          db.item.findFirstOrThrow({
            where: { id, organizationId },
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
          })
      )
    )
  )

export default resolver.pipe(resolver.zod(UpdateItem), resolver.authorize(), (input, ctx) =>
  pipe(
    getItem(input.id),
    Effect.flatMap((preItem) =>
      pipe(
        Effect.succeed(input),
        Effect.bind("blurHash", () =>
          preItem.image === input.image
            ? Effect.succeed(preItem.blurHash)
            : getBlurHash(preItem.image)
        ),
        Effect.flatMap(({ id, modifiers, managementId, categoryId, ...data }) =>
          Effect.attemptCatchPromise(
            () =>
              db.item.update({
                where: { id },
                include: { content: true, modifiers: true },
                data: {
                  ...data,
                  category: { connect: { id: categoryId } },
                  categoryItems: pipe(
                    A.findFirst(
                      preItem.categoryItems,
                      (ci) => ci.categoryId === preItem.categoryId
                    ),
                    O.map(
                      (catItem) =>
                        ({
                          update: {
                            where: {
                              id: catItem.id,
                            },
                            data: {
                              Category: { connect: { id: categoryId } },
                              position: 100,
                            },
                          },
                        } satisfies Prisma.CategoryItemUpdateManyWithoutItemNestedInput)
                    ),
                    O.getOrUndefined
                  ),
                  managementRepresentation: { id: managementId },
                  modifiers: {
                    update: pipe(
                      modifiers,
                      A.filter((m) => m.modifierId != null),
                      A.map(({ config, modifierId, managementId }, p) => ({
                        where: { id: modifierId! },
                        data: {
                          managementRepresentation: { id: managementId },
                          position: p,
                          config: {
                            ...config,
                            content: [
                              { locale: "en", ...config.content.en },
                              { locale: "he", ...config.content.he },
                            ],
                            options: pipe(
                              config.options as OptionsSchemaArray,
                              A.map(({ managementId, ...o }, i) => ({
                                ...o,
                                managementRepresentation: { id: managementId },
                                position: i,
                                content: [
                                  { locale: "en", ...o.content.en },
                                  { locale: "he", ...o.content.he },
                                ],
                              })),
                              A.map((o, i) =>
                                config._tag === "oneOf"
                                  ? {
                                      ...o,
                                      default: config.defaultOption === String(i),
                                    }
                                  : o
                              )
                            ),
                          },
                        },
                      }))
                    ),
                    create: pipe(
                      modifiers,
                      A.filter((m) => m.modifierId == null),
                      A.map(
                        (m, p) =>
                          ({
                            position: p,
                            managementRepresentation: { id: m.managementId },
                            config: {
                              ...m.config,
                              content: [
                                { locale: "en", ...m.config.content.en },
                                { locale: "he", ...m.config.content.he },
                              ],
                              options: pipe(
                                m.config.options as OptionsSchemaArray,
                                A.map((o, i) => ({
                                  ...o,
                                  position: i,
                                  content: [
                                    { locale: "en", ...o.content.en },
                                    { locale: "he", ...o.content.he },
                                  ],
                                })),
                                A.map((o) =>
                                  m.config._tag === "oneOf"
                                    ? {
                                        ...o,
                                        default: m.config.defaultOption === o.identifier,
                                      }
                                    : o
                                )
                              ),
                            },
                          } satisfies Prisma.ItemModifierCreateWithoutItemInput)
                      )
                    ),
                  } satisfies Prisma.ItemModifierUncheckedUpdateManyWithoutItemNestedInput,
                },
              }),
            (cause) => new PrismaError("Updating item failed", { cause, resource: "Item" })
          )
        )
      )
    ),
    Effect.provideService(AuthSessionContext, ctx.session),
    Renu.runPromise$
  )
)
