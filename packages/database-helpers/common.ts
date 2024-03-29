import * as S from "@effect/schema/Schema";
import { Locale } from "@prisma/client";

export const Content = S.struct({
  locale: S.enums(Locale),
  name: S.string,
  description: S.string,
});
export interface Content extends S.Schema.To<typeof Content> {}
