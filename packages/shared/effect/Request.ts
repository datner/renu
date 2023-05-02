import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RA from "@effect/data/ReadonlyRecord";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Schema from "@effect/schema/Schema";
import { Database } from "../Database";

type RequestError<Tag extends string> = Data.Case & { readonly _tag: `${Tag}Error` };

export const createRequest =
  <Tag extends string, E extends RequestError<Tag>>(tag: Tag) =>
  <I, A>(schema: Schema.Schema<I, A>) =>
  <P extends object = object>() =>
  <
    R extends (Request.Request<E, A> & P & { _tag: Tag }),
    F extends ((requests: R[], db: Database) => Promise<I[]>),
  >(
    f: F,
    pred: (req: R, datum: A) => boolean,
  ) =>
  <CR extends (...args: any[]) => P>(cr: CR) => {
    const SomeError = Data.tagged<E>(`${tag}Error`);
    const SomeRequest = Request.tagged<R>(tag);

    type RequestEffect = Effect.Effect<
      never,
      Request.Request.Error<R>,
      Request.Request.Success<R>
    >;

    const resolveSomeRequest = RequestResolver.makeBatched((
      requests: R[],
    ) =>
      pipe(
        Database,
        Effect.flatMap(db =>
          Effect.tryCatchPromise(
            () => f(requests, db),
            () => SomeError({} as any),
          )
        ),
        Effect.flatMap(Schema.decodeEffect(Schema.array(schema))),
        Effect.flatMap(data =>
          Effect.forEach(requests, req =>
            Request.completeEffect(
              req,
              Effect.mapError(
                A.findFirst(data, datum => pred(req, datum)),
                () => SomeError({} as any),
              ) as RequestEffect,
            ))
        ),
        Effect.refineTagOrDie(`${tag}Error` as any),
        Effect.catchAll((_) =>
          Effect.forEach(requests, req => Request.completeEffect(req, Effect.fail(_) as any as RequestEffect))
        ),
      )
    );

    return ((...args: Parameters<CR>) =>
      Effect.request(
        SomeRequest(cr(args) as any),
        RequestResolver.contextFromEffect(resolveSomeRequest),
      ));
  };

export const resolveBatch = <E, A, Req extends Request.Request<E, A[]>>(
  requests: Req[],
  getResult: (reqs: Req[], db: Database) => Promise<A[]>,
  getRequestKey: (r: Req) => string,
  getDataKey: (a: A) => string,
) =>
  pipe(
    Effect.flatMap(Database, db => Effect.promise(() => getResult(requests, db))),
    Effect.map(A.groupBy(getDataKey)),
    Effect.flatMap(data =>
      Effect.forEachPar(requests, req =>
        Request.succeed(
          req,
          pipe(
            RA.get(data, getRequestKey(req)),
            O.getOrElse(() => []),
          ) as any,
        ))
    ),
    // Effect.catchAll((_) => Effect.forEach(requests, req => Request.fail(req, _))),
  );

export const filterRequestsByTag = <
  K extends E["_tag"] & string,
  E extends {
    _tag: string;
  },
>(es: Array<E>, k: K): Array<
  Extract<E, {
    _tag: K;
  }>
> => A.filter(es, (_): _ is Extract<E, { _tag: K }> => _._tag === k);

export const resolveSingle = <E, A, R extends Request.Request<E, A>>(
  requests: R[],
  getResult: (reqs: R[], db: Database) => Promise<A[]>,
  resolve: (req: R, data: A[]) => Request.Request.Result<R>,
) =>
  pipe(
    Database,
    Effect.flatMap(db => Effect.promise(() => getResult(requests, db))),
    Effect.flatMap(data => Effect.forEachPar(requests, req => Request.complete(req, resolve(req, data)))),
  );