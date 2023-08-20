import { resolver } from "@blitzjs/rpc";
import * as Telegram from "integrations/telegram/sendMessage";
import { Renu } from "src/core/effect";
import { Format } from "telegraf";
import { z } from "zod";

export default resolver.pipe(
  resolver.zod(z.object({ comment: z.string() })),
  ({ comment }) => Telegram.notify(Format.fmt("A Cusomer sent the following feedback:\n\n", comment)),
  Renu.runPromise$,
);
