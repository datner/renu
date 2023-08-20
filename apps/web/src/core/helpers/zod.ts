import { z } from "zod";

export const Id = z.coerce.number().int().nonnegative();

export const Slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug should contain only lowercase letters, numbers, and dashes",
  })
  .regex(/[^-]$/, {
    message: "Slug should not end with a dash",
  });

export const BaseEntity = z.object({
  id: Id,
  identifier: Slug,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const IdOrSlug = z.union([
  BaseEntity.pick({ id: true }),
  BaseEntity.pick({ identifier: true }),
]);
