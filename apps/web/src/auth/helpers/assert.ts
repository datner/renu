import { NotFoundError } from "blitz"

export function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function assertFound(condition: any, message?: string): asserts condition {
  if (!condition) throw new NotFoundError(message)
}
