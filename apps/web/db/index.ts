import { EnhancedPrismaClientAddedMethods, enhancePrisma } from "blitz";
import { PrismaClient } from "database";
import { Layer } from "effect";
import { Database } from "shared";

const EnhancedPrisma = enhancePrisma(PrismaClient);

// add prisma to the NodeJS global type
declare global {
  var __db: PrismaClient & EnhancedPrismaClientAddedMethods;
}

function getDb() {
  let db;
  if (process.env.NODE_ENV === "development") {
    db = global.__db || new EnhancedPrisma();
    global.__db = db;
  }
  return db || new EnhancedPrisma();
}

// Prevent multiple instances of Prisma Client in development
const db = getDb();

export const layer = Layer.sync(Database.Database, () => Object.assign(getDb(), { _tag: "Database" as const }));

export * from "database";
export default db;
