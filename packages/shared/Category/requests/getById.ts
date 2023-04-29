import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Models from "database";
import { Database } from "../../Database";

export class GetCategoryByIdError extends Data.TaggedClass("GetCategoryByIdError")<{}> {}

export interface GetCategoryById extends Request.Request<GetCategoryByIdError, Models.Category> {
  readonly _tag: "GetCategoryById";
  readonly id: number;
}

export const GetCategoryById = Request.tagged<GetCategoryById>("GetCategoryById");

const resolveGetCategoryById = pipe(
  RequestResolver.makeBatched((
    requests: GetCategoryById[],
  ) =>
    pipe(
      Effect.flatMap(Database, db =>
        Effect.tryCatchPromise(
          () => db.category.findMany({ where: { id: { in: requests.map(req => req.id) } } }),
          () => new GetCategoryByIdError(),
        )),
      Effect.flatMap(data =>
        Effect.forEach(requests, req =>
          Request.completeEffect(
            req,
            Effect.mapError(
              A.findFirst(data, datum => req.id === datum.id),
              () => new GetCategoryByIdError(),
            ),
          ))
      ),
      Effect.catchAll((_) => Effect.forEach(requests, req => Request.completeEffect(req, Effect.fail(_)))),
    )
  ),
  RequestResolver.contextFromEffect,
);

export const getById = (id: number) =>
  Effect.request(
    GetCategoryById({ id }),
    resolveGetCategoryById,
  );
