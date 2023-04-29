import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Telegram from "integrations/telegram/sendMessage";
import { Session } from "src/auth";
import { api } from "src/blitz-server";
import { Renu } from "src/core/effect";

const buildPaths = (slug: string) =>
  pipe(
    ["/menu", "/kiosk"],
    A.map((u) => u + `/${slug}`),
    A.flatMap((u) => [u, "/he" + u, "/en" + u]),
  );

export default api((_req, res, ctx) =>
  pipe(
    Session.with((session) => session.venue.identifier),
    Effect.map(buildPaths),
    Effect.flatMap(Effect.forEachPar((p) => Effect.tryPromise(() => res.revalidate(p)))),
    Effect.tapError(() => Session.withEffect((s) => Telegram.alertDatner(`failed to revalidate ${s.venue.identifier}`))),
    Effect.match(
      () => res.status(500).send("Error Revalidating"),
      () => res.json({ revalidated: true }),
    ),
    Session.authorize(ctx),
    Renu.runPromise$,
  )
);
