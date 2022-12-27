import { resolver } from "@blitzjs/rpc"
import db from "db"
import { SendOrder } from "src/menu/validations/order"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as TE from "fp-ts/TaskEither"
import { z } from "zod"
import { pipe } from "fp-ts/function"
import { delegate } from "src/core/helpers/prisma"
import { getClearingPageLink, providers } from "integrations/clearing"
import { gotClient } from "integrations/http/gotHttpClient"
import { sendMessage } from "integrations/telegram/sendMessage"
import { HTTPError } from "got"
import { fullOrderInclude } from "integrations/clearing/clearingProvider"
import { breakers } from "integrations/http/circuitBreaker"

type SendOrder = z.infer<typeof SendOrder>

const createNewOrder = ({ orderItems, venueIdentifier }: SendOrder) =>
  createOrder({
    data: {
      venue: { connect: { identifier: venueIdentifier } },
      state: "Init",
      items: {
        create: orderItems.map((oi) => ({
          name: oi.name,
          price: oi.price,
          quantity: oi.amount,
          itemId: oi.item,
          comment: oi.comment,
          modifiers: {
            create: oi.modifiers.map((m) => ({
              amount: m.amount,
              price: m.price,
              ref: m.identifier,
              itemModifierId: m.id,
              choice: m.choice,
            })),
          },
        })),
      },
    },
    include: fullOrderInclude,
  })

const createOrder = delegate(db.order)((v) => v.create)

const getIntegration = (identifier: string) =>
  pipe(
    delegate(db.clearingIntegration)((c) => c.findFirstOrThrow)({
      where: { Venue: { identifier } },
    }),
    TE.orElseFirstTaskK(() =>
      sendMessage(`venue ${identifier} has no clearing integration but tried to clear anyways.`)
    )
  )

export default resolver.pipe(resolver.zod(SendOrder), (input) =>
  pipe(
    getIntegration(input.venueIdentifier),
    TE.chain((clearingIntegration) =>
      pipe(
        createNewOrder(input),
        RTE.fromTaskEither,
        RTE.chainW(getClearingPageLink),
        RTE.orElseFirstW((e) => {
          console.group(e.tag)
          if (e instanceof HTTPError) {
            console.log(e.code)
            console.log(e.response.body)
          }
          if (e instanceof Error) {
            console.log(e.message)
          }
          console.log(e)
          console.groupEnd()
          return RTE.of(null)
        })
      )({
        clearingProvider: providers[clearingIntegration.provider],
        clearingIntegration,
        httpClient: gotClient,
        circuitBreakerOptions: breakers[clearingIntegration.provider],
      })
    )
  )()
)
