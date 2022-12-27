import { constFalse, pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import * as A from "fp-ts/Array"
import * as TE from "fp-ts/TaskEither"
import { NextApiRequest, NextApiResponse } from "next"
import { getEnvVar } from "src/core/helpers/env"
import { match } from "ts-pattern"
import { api } from "src/blitz-server"

type UnknownTokenError = {
  tag: "UnknownTokenError"
}

type NoTokenError = {
  tag: "NoTokenError"
}

type NoPathError = {
  tag: "NoPathError"
}

type BadPathError = {
  tag: "BadPathError"
  paths: string[]
}

type RevalidationError = {
  tag: "RevalidationError"
  path: string
}

const ensureTokenMatch = E.fromPredicate(
  (req: NextApiRequest) =>
    pipe(
      E.Do,
      E.apSW("secret", getEnvVar("REVALIDATION_SECRET_TOKEN")),
      E.apSW("token", getSecretToken(req)),
      E.match(constFalse, ({ secret, token }) => secret === token)
    ),
  (): UnknownTokenError => ({ tag: "UnknownTokenError" })
)

const getSecretToken = (req: NextApiRequest) =>
  typeof req.query["secret"] === "string"
    ? E.right(req.query["secret"])
    : E.left<NoTokenError>({ tag: "NoTokenError" })

const getPathToRevalidate = (req: NextApiRequest) =>
  req.query["path"] != null
    ? E.right(req.query["path"])
    : E.left<NoPathError>({ tag: "NoPathError" })

const castArray = <A>(a: A | A[]) => (Array.isArray(a) ? a : A.of(a))
const isValidURL = (path: string) => {
  try {
    new URL(path, "http://renu.menu")
    return true
  } catch (e: unknown) {
    return false
  }
}

const ensureValidPaths = (paths: string[]) =>
  pipe(
    paths,
    E.fromPredicate(A.every(isValidURL), (paths): BadPathError => ({ tag: "BadPathError", paths }))
  )

const revalidatePaths = (res: NextApiResponse) =>
  A.map((path: string) =>
    TE.tryCatch(
      () => res.revalidate(path),
      (): RevalidationError => ({ tag: "RevalidationError", path })
    )
  )

const handler = api((req, res) =>
  pipe(
    E.of(req),
    E.chainW(ensureTokenMatch),
    E.chainW(getPathToRevalidate),
    E.map(castArray),
    E.chainW(ensureValidPaths),
    TE.fromEither,
    TE.map(revalidatePaths(res)),
    TE.map(TE.sequenceArray),
    TE.flattenW,
    TE.match(
      (e) =>
        match(e)
          .with({ tag: "UnknownTokenError" }, () =>
            res.status(401).json({ message: "invalid token" })
          )
          .with({ tag: "BadPathError" }, ({ paths }) =>
            res.status(400).json({ message: "paths invalid", paths })
          )
          .with({ tag: "NoPathError" }, () => res.status(400).json({ message: "no paths given" }))
          .with({ tag: "RevalidationError" }, () => res.status(500).send("error revalidating"))
          .exhaustive(),
      () => res.json({ revalidated: true })
    )
  )()
)

export default handler
