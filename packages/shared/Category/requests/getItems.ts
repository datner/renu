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

export class GetCategoryItemsError extends Data.TaggedClass("GetItemsByCategoryIdError")<{}> {}

export interface GetCategoryItems extends Request.Request<GetCategoryItemsError, Models.CategoryItem[]> {
  readonly _tag: "GetCategoryItems";
  readonly id: number;
}

export const GetCategoryItems = Request.tagged<GetCategoryItems>("GetCategoryItems");

const resolveGetCategoryItems = pipe(
  RequestResolver.makeBatched((
    requests: GetCategoryItems[],
  ) =>
    pipe(
      Effect.flatMap(Database, db =>
        Effect.tryPromise({
          try: () =>
            db.categoryItem.findMany({
              where: {
                categoryId: { in: requests.map(req => req.id) },
                Item: { is: { deleted: null } },
              },
              orderBy: { categoryId: "asc" },
            }),
          catch: () => new GetCategoryItemsError(),
        })),
      Effect.map(A.groupBy(c => String(c.categoryId))),
      Effect.flatMap(data =>
        Effect.forEach(requests, req =>
          Request.succeed(
            req,
            pipe(
              RA.get(data, String(req.id)),
              Option.getOrElse(() => []),
            ),
          ), { concurrency: "unbounded" })
      ),
      Effect.catchAll((_) => Effect.forEach(requests, req => Request.fail(req, _))),
    )
  ),
  RequestResolver.contextFromEffect,
);

export const getCategoryItems = (id: number) =>
  Effect.request(
    GetCategoryItems({ id }),
    resolveGetCategoryItems,
  );
