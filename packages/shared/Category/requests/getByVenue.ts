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

export class GetCategoryByVenueError extends Data.TaggedClass("GetCategoryByVenueError")<{}> {}

export interface GetCategoryByVenue extends Request.Request<GetCategoryByVenueError, Models.Category[]> {
  readonly _tag: "GetCategoryByVenue";
  readonly id: number;
}

export const GetCategoryByVenue = Request.tagged<GetCategoryByVenue>("GetCategoryByVenue");

const resolveGetCategoryByVenue = pipe(
  RequestResolver.makeBatched((
    requests: GetCategoryByVenue[],
  ) =>
    pipe(
      Effect.flatMap(Database, db =>
        Effect.tryPromise({
          try: () => db.category.findMany({ where: { id: { in: requests.map(req => req.id) } } }),
          catch: () => new GetCategoryByVenueError(),
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
    GetCategoryByVenue({ id }),
    resolveGetCategoryByVenue,
  );
