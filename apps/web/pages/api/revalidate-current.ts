import { SessionContext } from "@blitzjs/auth"
import { pipe } from "fp-ts/function"
import { api } from "src/blitz-server"
import * as A from "fp-ts/Array"
import * as RA from "fp-ts/ReadonlyArray"
import * as TE from "fp-ts/TaskEither"

const buildPaths = (slug: string) =>
  pipe(
    ["/menu", "/kiosk"],
    A.map((u) => u + `/${slug}`),
    A.chain((u) => [u, "/he" + u, "/en" + u]),
    RA.fromArray
  )

export default api((_req, res, ctx) => {
  const session: SessionContext = ctx.session
  session.$authorize()
  const revalidate = pipe(
    session.venue.identifier,
    buildPaths,
    TE.traverseArray((path) =>
      TE.tryCatch(
        () => res.revalidate(path),
        (e) => e
      )
    ),
    TE.match(
      () => res.status(500).send("Error Revalidating"),
      () => res.json({ revalidated: true })
    )
  )

  return revalidate()
})
