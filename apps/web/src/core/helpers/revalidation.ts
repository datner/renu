import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { getEnvVar } from "./env"

const host = process.env.NODE_ENV === "production" ? "https://renu.menu" : "http://localhost:3000"

type RevalidationFailedError = {
  tag: "RevalidationFailedError"
}

export const revalidate = (path: string) =>
  pipe(
    getEnvVar("REVALIDATION_SECRET_TOKEN"),
    TE.fromEither,
    TE.chainW(
      TE.tryCatchK(
        (secret) => {
          const url = new URL("/api/revalidate", host)
          url.searchParams.append("secret", secret)
          url.searchParams.append("path", path)
          return fetch(url.toString())
        },
        (): RevalidationFailedError => ({ tag: "RevalidationFailedError" })
      )
    )
  )

export const revalidateMany = (paths: string[]) =>
  pipe(
    getEnvVar("REVALIDATION_SECRET_TOKEN"),
    TE.fromEither,
    TE.chainW(
      TE.tryCatchK(
        (secret) => {
          const url = new URL("/api/revalidate", host)
          url.searchParams.append("secret", secret)
          paths.forEach((path) => url.searchParams.append("path", path))
          return fetch(url.toString())
        },
        (): RevalidationFailedError => ({ tag: "RevalidationFailedError" })
      )
    )
  )

export const revalidateVenue = (slug: string) => revalidateMany([`/menu/${slug}`, `/kiosk/${slug}`])
