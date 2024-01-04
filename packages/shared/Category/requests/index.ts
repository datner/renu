import { Effect } from "effect";
import { GetCategoryById } from "./getById";
import { GetCategoryContent } from "./getContent";
import { GetCategoryItems } from "./getItems";
import { CategoryResolver } from "./resolver";

export const getById = (id: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetCategoryById({ id }),
    CategoryResolver,
  ));

export const getContent = (id: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetCategoryContent({ id }),
    CategoryResolver,
  ));

export const getItems = (id: number) =>
  Effect.withRequestCaching(true)(Effect.request(
    GetCategoryItems({ id }),
    CategoryResolver,
  ));
