import * as Effect from "@effect/io/Effect";
import { GetCategoryById } from "./getById";
import { GetCategoryContent } from "./getContent";
import { GetCategoryItems } from "./getItems";
import { CategoryResolver } from "./resolver";

export const getById = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetCategoryById({ id }),
    CategoryResolver,
  ));

export const getContent = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetCategoryContent({ id }),
    CategoryResolver,
  ));

export const getItems = (id: number) =>
  Effect.withRequestBatching("on")(Effect.request(
    GetCategoryItems({ id }),
    CategoryResolver,
  ));
