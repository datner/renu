import { Effect, pipe, ReadonlyArray as A } from "effect";
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
    Effect.flatMap(Effect.forEach((p) => Effect.tryPromise(() => res.revalidate(p)), { concurrency: "unbounded" })),
    Effect.tapError(() =>
      Session.withEffect((s) => Telegram.alertDatner(`failed to revalidate ${s.venue.identifier}`))
    ),
    Effect.match({
      onFailure: () => res.status(500).send("Error Revalidating"),
      onSuccess: () => res.json({ revalidated: true }),
    }),
    Session.authorize(ctx),
    Renu.runPromise$,
  )
);
