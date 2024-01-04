import * as Schema from "@effect/schema/Schema";
import { Context, Data, Effect, Exit, Layer, Option, Request, RequestResolver } from "effect";
import { Database } from "../Database";
import * as Order from "../Order/order";
import * as internal from "./internal/service";
import * as Venue from "./venue";

// ========== Models ==========

export interface Venues {
  readonly _: unique symbol;
}

class VenuesError extends Data.TaggedClass("VenuesError")<{}> {}

// ========== Requests ==========

interface GetById extends Request.Request<VenuesError, Venue.Venue> {
  readonly _tag: "Venues.GetById";
  readonly id: number;
}
const GetById = Request.tagged<GetById>("Venues.GetById");

interface GetByCuid extends Request.Request<VenuesError, Venue.Venue> {
  readonly _tag: "Venues.GetByCuid";
  readonly cuid: string;
}
const GetByCuid = Request.tagged<GetByCuid>("Venues.GetByCuid");

interface GetOrdersById extends Request.Request<VenuesError, ReadonlyArray<Order.Order>> {
  readonly _tag: "Venues.GetOrdersById";
  readonly id: number;
}
const GetOrdersById = Request.tagged<GetOrdersById>("Venues.GetOrdersById");

// ========== Service ==========

const VenuesService = Effect.gen(function*(_) {
  const db = yield* _(Database);

  const getByIdResolver = RequestResolver.makeBatched<never, GetById>(
    Effect.forEach(req =>
      Effect.tryPromise(() => db.venue.findUnique({ where: { id: req.id } })).pipe(
        Effect.flatMap(Option.fromNullable),
        Effect.flatMap(Schema.decode(Venue.Venue)),
        Effect.mapError(() => new VenuesError()),
        Effect.tap(_ =>
          Effect.fromNullable(_.cuid).pipe(
            Effect.flatMap(cuid => Effect.cacheRequestResult(GetByCuid({ cuid }), Exit.succeed(_))),
            Effect.ignore,
          )
        ),
        Effect.exit,
        Effect.flatMap(_ => Request.complete(req, _)),
      ), { concurrency: "inherit", discard: true }),
  );
  const getById = (id: number) =>
    Effect.request(
      GetById({ id }),
      getByIdResolver,
    ).pipe(Effect.withRequestCaching(true));

  const getByCuidResolver = RequestResolver.makeBatched<never, GetByCuid>(
    Effect.forEach(req =>
      Effect.tryPromise(() => db.venue.findUnique({ where: { cuid: req.cuid } })).pipe(
        Effect.flatMap(Option.fromNullable),
        Effect.flatMap(Schema.decode(Venue.Venue)),
        Effect.mapError(() => new VenuesError()),
        Effect.tap(_ => Effect.cacheRequestResult(GetById({ id: _.id }), Exit.succeed(_))),
        Effect.exit,
        Effect.flatMap(_ => Request.complete(req, _)),
      ), { concurrency: "inherit", discard: true }),
  );
  const getByCuid = (cuid: string) =>
    Effect.request(
      GetByCuid({ cuid }),
      getByCuidResolver,
    ).pipe(Effect.withRequestCaching(true));

  const getOrdersByIdResolver = RequestResolver.makeBatched<never, GetOrdersById>(
    Effect.forEach(
      req =>
        Effect.tryPromise(
          () => db.venue.findUnique({ where: { id: req.id } }).orders(),
        ).pipe(
          Effect.flatMap(Option.fromNullable),
          Effect.flatMap(Schema.decode(Schema.array(Order.Order))),
          Effect.mapError(() => new VenuesError()),
          Effect.exit,
          Effect.flatMap(_ => Request.complete(req, _)),
        ),
      { concurrency: "inherit", discard: true },
    ),
  );
  const getOrdersById = (id: number) =>
    Effect.request(
      GetOrdersById({ id }),
      getOrdersByIdResolver,
    ).pipe(Effect.withRequestCaching(true));

  return {
    getById,
    getByCuid,
    getOrdersById,
  };
});
export interface VenuesService extends Effect.Effect.Success<typeof VenuesService> {}

// ========== Context ==========

export const tag: Context.Tag<Venues, VenuesService> = internal.tag;

export const layer = Layer.effect(tag, VenuesService);

// ========== API ==========

export const {
  getById,
  getByCuid,
  getOrdersById,
} = Effect.serviceFunctions(tag);
