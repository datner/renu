import { resolver } from "@blitzjs/rpc";
import * as Effect from "@effect/io/Effect";
import * as Ref from "@effect/io/Ref";
import { flow, pipe } from "@fp-ts/core/Function";
import * as Optic from "@fp-ts/optic";
import * as Clearing from "@integrations/clearing";
import { CircuitBreaker, Http } from "@integrations/core";
import * as Management from "@integrations/management";
import { NotFoundError } from "blitz";
import db, { OrderState, Prisma } from "db";
import * as Renu from "src/core/effect/runtime";
import { ManagementUnreachableError } from "src/core/errors";
import { prismaError } from "src/core/helpers/prisma";
import { Id } from "src/core/helpers/zod";
import { z } from "zod";

const ValidateStatus = z.object({
  orderId: z
    .union([Id, z.string().transform(Number)])
    .nullable()
    .refine((id): id is number => id != null),
  txId: z
    .string()
    .nullable()
    .refine((txId): txId is string => txId != null),
});

const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude;

type DeepOrder = Prisma.OrderGetPayload<{ include: typeof fullOrderInclude }>;

const orderState = Optic.id<DeepOrder>().at("state");
const orderTxId = Optic.id<DeepOrder>().at("txId");

const runOperations = (order: DeepOrder) =>
  Effect.gen(function*($) {
    const orderRef = yield* $(Ref.make(order));
    const confirmPaidFor = pipe(
      Ref.get(orderRef),
      Effect.flatMap(Clearing.validateTransaction),
      Effect.flatMap((txId) =>
        Effect.tryCatchPromise(
          () =>
            db.order.update({
              where: { id: order.id },
              data: { state: OrderState.PaidFor, txId },
            }),
          prismaError("Order"),
        )
      ),
      Effect.flatMap((updated) =>
        Ref.updateAndGet(
          orderRef,
          flow(
            Optic.replace(orderState)(updated.state),
            Optic.replace(orderTxId)(updated.txId),
          ),
        )
      ),
    );

    const confirmReported = pipe(
      Ref.get(orderRef),
      Effect.flatMap(Management.reportOrder),
      Effect.flatMap(() =>
        Effect.tryCatchPromise(
          () =>
            db.order.update({
              where: { id: order.id },
              data: { state: OrderState.Unconfirmed },
            }),
          prismaError("Order"),
        )
      ),
      Effect.flatMap((updated) => Ref.updateAndGet(orderRef, Optic.replace(orderState)(updated.state))),
    );

    const updateOrder = pipe(
      Ref.get(orderRef),
      Effect.flatMap(Management.getOrderStatus),
      Effect.flatMap((state) =>
        Effect.tryCatchPromise(
          () => db.order.update({ where: { id: order.id }, data: { state } }),
          prismaError("Order"),
        )
      ),
      Effect.flatMap((updated) => Ref.updateAndGet(orderRef, Optic.replace(orderState)(updated.state))),
    );

    switch (order.state) {
      case "Init":
        yield* $(confirmPaidFor);

      case "PaidFor":
        yield* $(confirmReported);

      case "Unconfirmed": {
        yield* $(updateOrder);
      }
    }

    return order;
  });

export default resolver.pipe(
  resolver.zod(ValidateStatus),
  (input) =>
    Renu.runPromiseEither$(
      Effect.flatMap(
        Effect.tryCatchPromise(
          () =>
            db.order.findUniqueOrThrow({
              where: { id: input.orderId },
              include: fullOrderInclude,
            }),
          prismaError("Order"),
        ),
        (order) =>
          pipe(
            Effect.ifEffect(
              Effect.succeed(order.state !== OrderState.Confirmed),
              runOperations(order),
              Effect.succeed(order),
            ),
            Effect.provideServiceEffect(
              Management.Integration,
              Effect.tryCatchPromise(
                () =>
                  db.managementIntegration.findFirstOrThrow({
                    where: { Venue: { id: order.venueId } },
                  }),
                prismaError("ManagementIntegration"),
              ),
            ),
            Effect.provideServiceEffect(
              Clearing.IntegrationSettingsService,
              Effect.tryCatchPromise(
                () =>
                  db.clearingIntegration.findFirstOrThrow({
                    where: { Venue: { id: order.venueId } },
                  }),
                prismaError("ClearingIntegration"),
              ),
            ),
            Effect.catchAll((e) =>
              Effect.failSync(() => {
                if (e.cause instanceof Http.HttpNotFoundError) {
                  return new NotFoundError();
                }
                if (e.cause instanceof CircuitBreaker.CircuitBreakerError) {
                  return new ManagementUnreachableError();
                }

                return new NotFoundError("Order not found");
              })
            ),
          ),
      ),
    ),
);
