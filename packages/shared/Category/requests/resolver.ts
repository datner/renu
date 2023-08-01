import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Models from "database";
import { inspect } from "util";
import { Database } from "../../Database";
import { resolveBatch, resolveSingle } from "../../effect/Request";
import { GetCategoryById, GetCategoryByIdError } from "./getById";
import { GetCategoryContent } from "./getContent";
import { GetCategoryItems } from "./getItems";

type CategoryRequest = GetCategoryById | GetCategoryContent | GetCategoryItems;

export const CategoryResolver = pipe(
  RequestResolver.makeBatched((
    requests: CategoryRequest[],
  ) =>
    Effect.all([
      Effect.sync(() => console.log(inspect(requests.map(r => r._tag), false, null, true))),
      resolveBatch(
        A.filter(requests, (_): _ is GetCategoryItems => _._tag === "GetCategoryItems"),
        (reqs, db) =>
          db.categoryItem.findMany({
            where: { categoryId: { in: reqs.map(req => req.id) }, Item: { deleted: null } },
            orderBy: { categoryId: "asc" },
          }),
        r => String(r.id),
        d => String(d.categoryId),
      ),
      resolveBatch(
        A.filter(requests, (_): _ is GetCategoryContent => _._tag === "GetCategoryContent"),
        (reqs, db) =>
          db.categoryI18L.findMany({
            where: { categoryId: { in: reqs.map(req => req.id) } },
            orderBy: { categoryId: "asc" },
          }),
        r => String(r.id),
        d => String(d.categoryId),
      ),
      resolveSingle(
        A.filter(requests, (_): _ is GetCategoryById => _._tag === "GetCategoryById"),
        (reqs, db) =>
          db.category.findMany({
            where: idIn(reqs),
            orderBy: { identifier: "asc" },
          }),
        (req, items) =>
          Option.match(
            A.findFirst(items, _ => _.id === req.id),
            {
              onNone: () => Exit.fail(new GetCategoryByIdError()),
              onSome: Exit.succeed,
            },
          ),
      ),
    ], { concurrency: "unbounded" })
  ),
  RequestResolver.contextFromServices(Database),
);

const idIn = (reqs: GetCategoryById[]) => ({
  id: {
    in: A.map(reqs, _ => _.id),
  },
} satisfies Models.Prisma.CategoryWhereInput);
