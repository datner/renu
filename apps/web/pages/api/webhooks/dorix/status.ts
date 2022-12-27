import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"
import { ORDER_STATUS } from "integrations/dorix/types"
import { NextApiRequest, NextApiResponse } from "next"
import { ensureMethod } from "pages/api/payments/callback"
import { ensureType } from "src/core/helpers/zod"
import { updateOrder } from "src/orders/helpers/prisma"
import { z } from "zod"
import { OrderState } from "@prisma/client"
import { Format } from "telegraf"
import { sendMessage } from "integrations/telegram/sendMessage"
import { match, P } from "ts-pattern"

const DorixSuccess = z.object({
  endpoint: z.string().url(),
  action: z.string(),
  order: z.object({
    status: z.nativeEnum(ORDER_STATUS),
    id: z.string(),
    externalId: z.coerce.number(),
    source: z.literal("RENU"),
    metadata: z.record(z.string()),
    estimatedTime: z.number(),
  }),
  branch: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

const DorixFailure = z.object({
  endpoint: z.string().url(),
  action: z.string(),
  order: z.object({
    status: z.nativeEnum(ORDER_STATUS),
    externalId: z.coerce.number(),
    source: z.literal("RENU"),
    metadata: z.record(z.any()),
  }),
  branch: z.object({
    id: z.string(),
  }),
  error: z
    .object({
      message: z.string(),
      stack: z.string(),
    })
    .optional(),
})

const DorixResponse = z.union([DorixSuccess, DorixFailure])

const ensureSuccess = (response: z.infer<typeof DorixResponse>) =>
  pipe(
    response,
    E.fromPredicate(
      (r): r is z.infer<typeof DorixSuccess> => !("error" in r),
      (r) => ({
        tag: "DorixError",
        error: new Error((r as z.infer<typeof DorixFailure>).error?.message),
      })
    )
  )

const handler = async (req: NextApiRequest, res: NextApiResponse) =>
  pipe(
    req,
    ensureMethod("POST"),
    E.map((req) => req.body),
    E.chainW(ensureType(DorixResponse)),
    E.chainW(ensureSuccess),
    TE.fromEither,
    TE.chainW((ds) =>
      updateOrder({
        where: { id: ds.order.externalId },
        data: {
          state: match(ds.order.status)
            .with(P.union("FAILED", "UNREACHABLE"), () => OrderState.Cancelled)
            .with("AWAITING_TO_BE_RECEIVED", () => OrderState.Unconfirmed)
            .otherwise(() => OrderState.Confirmed),
        },
      })
    ),
    TE.orElseFirstTaskK((e) =>
      sendMessage(
        Format.fmt(
          `Error in dorix callback\n\n`,
          Format.pre("none")(e.error instanceof Error ? e.error.message : e.tag)
        )
      )
    ),
    TE.bimap(
      (e) => res.status(500).json(e),
      () => res.status(200).json({ success: true })
    )
  )()

export default handler
