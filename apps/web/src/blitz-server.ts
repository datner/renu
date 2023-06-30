import { AuthServerPlugin, PrismaStorage } from "@blitzjs/auth";
import { simpleRolesIsAuthorized } from "@blitzjs/auth";
import { setupBlitzServer } from "@blitzjs/next";
import { BlitzLogger } from "blitz";
import db from "db";
import { authConfig } from "./blitz-client";

export const defaultLogger = BlitzLogger({
  prettyLogTemplate: "{{logLevelName}}\t[{{name}}]\t",
  type: process.env.NODE_ENV === "production" ? "json" : "pretty",
});

export const { gSSP, gSP, api } = setupBlitzServer({
  plugins: [
    AuthServerPlugin({
      ...authConfig,
      storage: PrismaStorage(db),
      isAuthorized: simpleRolesIsAuthorized,
    }),
  ],
  logger: defaultLogger,
});
