import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RA from "@effect/data/ReadonlyRecord";
import * as Effect from "@effect/io/Effect";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Models from "database";
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
      Effect.map(A.groupBy(c => String(c.id))),
      Effect.flatMap(data =>
        Effect.forEach(requests, req =>
          Request.succeed(
            req,
            pipe(
              RA.get(data, String(req.id)),
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
