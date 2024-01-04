import { PrismaClient } from "database";
import { Context } from "effect";

export interface DB {
  readonly _: unique symbol;
}

export interface Database extends PrismaClient {
  readonly _tag: "Database";
}
const symbol = Symbol("@renu/shared/Database");
export const Database = Context.Tag<DB, Database>(symbol);
