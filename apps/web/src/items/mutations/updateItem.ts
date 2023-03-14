import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"
import * as A from "fp-ts/Array"
import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import { pipe, tuple } from "fp-ts/function"
import { OptionsSchemaArray, UpdateItem } from "../validations"
import { PrismaError } from "src/core/helpers/prisma"
import { AuthenticatedSessionContext } from "@blitzjs/auth"
import { getBlurHash } from "src/core/helpers/plaiceholder"
import * as Renu from "src/core/effect/runtime"

const AuthSessionContext = Context.Tag<AuthenticatedSessionContext>()

const getItem = (id: number) =>
  pipe(
    Effect.service(AuthSessionContext),
    Effect.map((s) => s.organization.id),
    Effect.flatMap((organizationId) =>
      Effect.tryCatchPromise(
        () =>
          db.item.findFirstOrThrow({
            where: { id, organizationId },
            select: { image: true, blurHash: true },
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
    Effect.flatMap((i) =>
      pipe(
        Effect.succeed(input),
        Effect.bind("blurHash", () =>
          i.image === input.image ? Effect.succeed(i.blurHash) : getBlurHash(i.image)
        )
      )
    ),
    Effect.flatMap(({ id, modifiers, managementId, ...data }) =>
      Effect.tryCatchPromise(
        () =>
          db.item.update({
            where: { id },
            include: { content: true, modifiers: true },
            data: {
              ...data,
              managementRepresentation: { id: managementId },
              modifiers: {
                update: pipe(
                  modifiers,
                  A.mapWithIndex(tuple),
                  A.filter(([, m]) => m.modifierId != null),
                  A.map(([p, { config, modifierId, managementId }]) => ({
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
                          A.mapWithIndex((i, { managementId, ...o }) => ({
                            ...o,
                            managementRepresentation: { id: managementId },
                            position: i,
                            content: [
                              { locale: "en", ...o.content.en },
                              { locale: "he", ...o.content.he },
                            ],
                          })),
                          A.mapWithIndex((i, o) =>
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
                  A.mapWithIndex(tuple),
                  A.filter(([, m]) => m.modifierId == null),
                  A.map(
                    ([p, m]) =>
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
                            A.mapWithIndex((i, o) => ({
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
    ),
    Effect.provideService(AuthSessionContext, ctx.session),
    Renu.runPromise$
  )
)
