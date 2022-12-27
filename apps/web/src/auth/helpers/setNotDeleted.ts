import { Prisma } from "db"

export function setNotDeleted<T extends object>(
  input: T
): T & { deleted: Prisma.DateTimeNullableFilter | Date | string | null } {
  if ("deleted" in input) {
    // Pass through the input
    return input as T & { deleted: Prisma.DateTimeNullableFilter | Date | string | null }
  }
  return { ...input, deleted: null }
}
