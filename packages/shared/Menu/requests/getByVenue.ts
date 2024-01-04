import * as Models from "database";
import { Data, Effect, Option, pipe, ReadonlyArray, ReadonlyRecord, Request, RequestResolver } from "effect";
import { Database } from "../../Database";

export class GetMenusByVenueError extends Data.TaggedClass("GetMenusByVenueError")<{}> {}

export interface GetMenusByVenue extends Request.Request<GetMenusByVenueError, Models.Menu[]> {
  readonly _tag: "GetMenusByVenue";
  readonly id: number;
}

export const GetMenusByVenue = Request.tagged<GetMenusByVenue>("GetMenusByVenue");

const resolveGetMenusByVenue = pipe(
  RequestResolver.makeBatched((
    requests: GetMenusByVenue[],
  ) =>
    pipe(
      Effect.flatMap(Database, db =>
        Effect.tryPromise({
          try: () => db.menu.findMany({ where: { id: { in: requests.map(req => req.id) } } }),
          catch: () => new GetMenusByVenueError(),
        })),
      Effect.map(ReadonlyArray.groupBy(c => String(c.id))),
      Effect.flatMap(data =>
        Effect.forEach(requests, req =>
          Request.succeed(
            req,
            pipe(
              ReadonlyRecord.get(data, String(req.id)),
              Option.getOrElse(() => []),
            ),
          ))
      ),
      Effect.catchAll((_) => Effect.forEach(requests, req => Request.completeEffect(req, Effect.fail(_)))),
    )
  ),
  RequestResolver.contextFromEffect,
);

export const getByVenue = (id: number) =>
  Effect.request(
    GetMenusByVenue({ id }),
    resolveGetMenusByVenue,
  );
