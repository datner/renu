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

export class GetCategoryContentError extends Data.TaggedClass("GetContentByCategoryIdError")<{}> {}

export interface GetCategoryContent extends Request.Request<GetCategoryContentError, Models.CategoryI18L[]> {
  readonly _tag: "GetCategoryContent";
  readonly id: number;
}

export const GetCategoryContent = Request.tagged<GetCategoryContent>("GetCategoryContent");

const resolveGetCategoryContent = pipe(
  RequestResolver.makeBatched((
    requests: GetCategoryContent[],
  ) =>
    pipe(
      Effect.flatMap(Database, db =>
        Effect.tryPromise({
          try: () =>
            db.categoryI18L.findMany({
              where: { categoryId: { in: requests.map(req => req.id) } },
              orderBy: { categoryId: "asc" },
            }),
          catch: () => new GetCategoryContentError(),
        })),
      Effect.map(A.groupBy(c => String(c.categoryId!))),
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
      Effect.catchAll((_) => Effect.forEach(requests, req => Request.fail(req, _))),
    )
  ),
  RequestResolver.contextFromEffect,
);

export const getCategoryContent = (id: number) =>
  Effect.request(
    GetCategoryContent({ id }),
    resolveGetCategoryContent,
  );
