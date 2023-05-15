import { SessionContext, SimpleRolesIsAuthorized } from "@blitzjs/auth";
import { GlobalRole, MembershipRole, Organization, Restaurant, User, Venue } from "db";

type Role = GlobalRole | MembershipRole;

declare module "@blitzjs/auth" {
  export interface Ctx {
    session: SessionContext;
  }
  export interface Session {
    isAuthorized: SimpleRolesIsAuthorized<Role>;
    PublicData: {
      orderId?: number;
      userId: User["id"];
      roles: Role[];
      venue?: Venue;
      orgId?: Organization["id"];
      organization?: Organization;
      restaurantId?: Restaurant["id"];
      impersonatingFromUserId?: number;
    };
  }
  export interface AuthenticatedSessionContext {
    userId: User["id"];
    roles: Role[];
    venue: Venue;
    orgId: Organization["id"];
    organization: Organization;
  }
  export interface AuthenticatedClientSession {
    userId: User["id"];
    roles: Role[];
    venue: Venue;
    orgId: Organization["id"];
    organization: Organization;
  }
}

declare global {
  interface ProcessEnvVars {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly DATABASE_URL: string;
    readonly IMGIX_API_KEY: string;
    readonly IMGIX_SOURCE_ID: string;
    readonly DORIX_API_URL: string;
    readonly DORIX_QA_API_URL: string;
    readonly DORIX_API_KEY: string;
    readonly TELEGRAM_BOT_TOKEN: string;
    readonly TELEGRAM_CHAT_ID: string;
    readonly CREDIT_GUARD_API_URL: string;
    readonly PAY_PLUS_API_KEY: string;
    readonly PAY_PLUS_SECRET_KEY: string;
    readonly PAY_PLUS_API_URL: string;
    readonly PAY_PLUS_QA_API_URL: string;
    readonly REVALIDATION_SECRET_TOKEN: string;
  }
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnvVars {}
  }
}
