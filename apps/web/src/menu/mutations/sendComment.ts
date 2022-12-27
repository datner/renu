import { resolver } from "@blitzjs/rpc"
import { sendMessage } from "integrations/telegram/sendMessage"
import { Format } from "telegraf"
import { z } from "zod"

export default resolver.pipe(resolver.zod(z.object({ comment: z.string() })), ({ comment }) =>
  sendMessage(Format.fmt("A Cusomer sent the following feedback:\n\n", comment))()
)
