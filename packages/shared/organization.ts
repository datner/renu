import * as S from "@effect/schema/Schema";
import * as Common from "./schema/common";

export const Id = Common.Id("OrganizationId");
export type Id = S.Schema.To<typeof Id>;
