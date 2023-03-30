import * as Effect from "@effect/io/Effect";
import * as Config from "@effect/io/Config";
import * as Context from "@effect/data/Context";
import * as S from "@effect/schema/Schema";
import * as P from "@effect/schema/Parser";
import { pipe } from "@effect/data/Function";
import { Clearing } from "@integrations/core";
import { ClearingProvider } from "database";

export const GamaConfig = Config.all({
  test: Config.all({
    url: Config.string(`gama.test.api.url`),
  }),
  demo: Config.all({
    url: Config.string(`gama.demo.api.url`),
  }),
  url: Config.string(`gama.api.url`),
});

export const GamaClientId = pipe(S.number, S.brand("GamaClientId"));
export type GamaClientId = S.To<typeof GamaClientId>;

export const GamaClientSecret = pipe(S.string, S.brand("GamaClientSecret"));
export type GamaClientSecret = S.To<typeof GamaClientSecret>;

export const GamaEnv = {
  test: "test",
  demo: "demo",
  prod: "production",
} as const;

export const VendorData = S.struct({
  id: GamaClientId,
  secret_key: GamaClientSecret,
  env: S.enums(GamaEnv),
});
export interface VendorData extends S.To<typeof VendorData> {}

const is = <A, B extends A>(b: B) => (a:A): a is B => a === b   
export const GamaIntegrations = S.struct({
  provider: pipe(
    S.enums(ClearingProvider),
    S.filter(is(ClearingProvider.GAMA)),
  ),
  vendorData: pipe(S.json, S.filter<S.Json, VendorData>(S.is(VendorData))),
});

export const Integration = pipe(
  Clearing.Integration,
  S.omit("vendorData"),
  S.omit("provider"),
  S.extend(GamaIntegrations),
);
export interface Integration extends S.To<typeof Integration> {}
export const IntegrationService = Context.Tag<Integration>();
export type IntegrationService = typeof IntegrationService;

export const gamaIntegrationLayer = pipe(
  Clearing.IntegrationSettingsService,
  Effect.flatMap(P.parseEffect(Integration)),
  Effect.mapError(
    (cause) =>
      new Clearing.ClearingError("failed to parse integration setting", {
        provider: "GAMA",
        cause,
      }),
  ),
  Effect.toLayer(IntegrationService),
);
