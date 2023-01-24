import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"
import * as A from "fp-ts/Array"
import * as Z from "@effect/io/Effect"
import * as Context from "@fp-ts/data/Context"
import { pipe, tuple } from "fp-ts/function"
import { OptionsSchemaArray, UpdateItem } from "../validations"
import { PrismaError } from "src/core/helpers/prisma"
import { AuthenticatedSessionContext } from "@blitzjs/auth"
import { getBlurHash } from "src/core/helpers/plaiceholder"

const AuthSessionContext = Context.Tag<AuthenticatedSessionContext>()

const getItem = (id: number) =>
  pipe(
    Z.service(AuthSessionContext),
    Z.map((s) => s.organization.id),
    Z.flatMap((organizationId) =>
      Z.tryCatchPromise(
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
  Z.unsafeRunPromiseEither(
    pipe(
      getItem(input.id),
      Z.flatMap((i) =>
        pipe(
          Z.succeed(input),
          Z.bind("blurHash", () =>
            i.image === input.image ? Z.succeed(i.blurHash) : getBlurHash(i.image)
          )
        )
      ),
      Z.flatMap(({ id, modifiers, managementId, ...data }) =>
        Z.tryCatchPromise(
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
      Z.provideService(AuthSessionContext)(ctx.session)
    )
  )
)
