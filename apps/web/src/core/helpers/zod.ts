import { Prisma } from "@prisma/client"
import * as E from "fp-ts/Either"
import { z } from "zod"

export const Id = z.coerce.number().int().nonnegative()

export const Slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug should contain only lowercase letters, numbers, and dashes",
  })
  .regex(/[^-]$/, {
    message: "Slug should not end with a dash",
  })

export const BaseEntity = z.object({
  id: Id,
  identifier: Slug,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const IdOrSlug = z.union([
  BaseEntity.pick({ id: true }),
  BaseEntity.pick({ identifier: true }),
])

type ZodIso<A extends z.ZodTypeAny> = {
  unparse(input: z.output<A>): z.input<A>
}

export function zodIso<A extends z.ZodTypeAny>(
  schema: A,
  unparse: (o: z.output<A>) => z.input<A>
): A & ZodIso<A> {
  return Object.assign(schema, { unparse })
}

export const None = z.object({
  _tag: z.literal("None"),
})

export const Some = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    _tag: z.literal("Some"),
    value: schema,
  })

export const Option = <T extends z.ZodTypeAny>(schema: T) =>
  z.discriminatedUnion("_tag", [None, Some(schema)])

export type ZodParseError<T = unknown> = {
  tag: "zodParseError"
  error: z.ZodError<T>
  raw: unknown
}

export const ensureType =
  <Schema extends z.ZodTypeAny>(schema: Schema) =>
  <D extends unknown>(data: D): E.Either<ZodParseError<Schema>, z.output<Schema>> => {
    const result = schema.safeParse(data)
    return result.success
      ? E.right(result.data as z.output<Schema>)
      : E.left({ tag: "zodParseError", error: result.error, raw: data })
  }

export const Primitives = z.union([z.string(), z.number(), z.boolean(), z.null()])
export const Json: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([Primitives, z.array(Json), z.record(Json)])
)
