import * as Context from "@effect/data/Context";
import { PrismaClient } from "database";

export interface DB {
  readonly _: unique symbol;
}

export interface Database extends PrismaClient {
  readonly _tag: "Database";
}
const symbol = Symbol("@renu/shared/Database");
export const Database = Context.Tag<DB, Database>(symbol);
