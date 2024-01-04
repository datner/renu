import { Effect, pipe, ReadonlyArray, Request, RequestResolver } from "effect";
import { Database } from "../../Database";
import { GetCategoryById } from "./getById";
import { GetCategoryContent } from "./getContent";
import { GetCategoryItems } from "./getItems";

type CategoryRequest = GetCategoryById | GetCategoryContent | GetCategoryItems;

export const CategoryResolver = pipe(
  RequestResolver.makeBatched((
    requests: CategoryRequest[],
  ) => {
    const reqMap = ReadonlyArray.groupBy(requests, _ => _._tag);
    const byId = reqMap.GetCategoryById as GetCategoryById[] ?? [];
    const content = reqMap.GetCategoryContent as GetCategoryContent[] ?? [];
    const items = reqMap.GetCategoryItems as GetCategoryItems[] ?? [];
    return Effect.andThen(Database, db =>
      Effect.all({
        GetCategoryById: Effect.promise(() =>
          db.category.findMany({
            where: {
              id: { in: byId.map(_ => _.id) },
            },
            include: { content: true },
          })
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(byId)),
          Effect.flatMap(
            Effect.forEach(([category, req]) => Request.succeed(req, category)),
          ),
        ),
        GetCategoryContent: Effect.promise(() =>
          Promise.all(
            content.map(_ => db.category.findUnique({ where: { id: _.id } }).content()),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(content)),
          Effect.flatMap(
            Effect.forEach(([contents, req]) => Request.succeed(req, contents ?? [])),
          ),
        ),
        GetCategoryItems: Effect.promise(() =>
          Promise.all(
            items.map(_ =>
              db.category.findUnique({ where: { id: _.id } }).categoryItems({
                where: { Item: { deleted: null } },
                include: { Item: true },
              })
            ),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(items)),
          Effect.flatMap(
            Effect.forEach(([items, req]) => Request.succeed(req, items ?? [])),
          ),
        ),
      }, { concurrency: 4 }));
  }),
  RequestResolver.contextFromServices(Database),
);
