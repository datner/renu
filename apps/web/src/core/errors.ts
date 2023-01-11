import Superjson from "superjson"

export class ManagementUnreachableError extends Error {
  name = "ManagementUnreachableError"
}

Superjson.registerClass(ManagementUnreachableError, { identifier: "ManagementUnreachableError" })
