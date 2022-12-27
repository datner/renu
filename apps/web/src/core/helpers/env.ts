import * as E from "fp-ts/Either"
import { pipe, Lazy } from "fp-ts/function"

export type NoEnvVarError = {
  tag: "NoEnvVarError"
  error: unknown
  key: keyof NodeJS.ProcessEnv
}

export const getEnvVar = (key: keyof ProcessEnvVars) =>
  pipe(
    process.env[key],
    E.fromNullable<NoEnvVarError>({
      tag: "NoEnvVarError",
      key,
      error: new Error(`${key} could not be found in environment`),
    })
  )

export const host: Lazy<string> = () =>
  process.env.NODE_ENV === "production" ? "https://renu.menu" : "http://localhost:3000"
