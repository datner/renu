import * as Context from "@effect/data/Context";
import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as P from "@effect/data/Predicate";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";

export interface HttpConfig {
  readonly baseUrl?: string;
  readonly headers?: HeadersInit;
}

export interface HttpConfigService {
  readonly baseUrl?: string;
  readonly headers?: HeadersInit;
}
export const HttpConfigService = Context.Tag<HttpConfigService>();

export interface Http {
  readonly _: unique symbol;
}

export interface HttpService {
  request: HttpRequest;
}
export const HttpService = Context.Tag<Http, HttpService>();
export const Http = HttpService;
export const Service = Http;

interface GenericError {
  response: Response;
}

export type HttpError =
  | HttpResponseError
  | HttpRequestError
  | HttpNotFoundError
  | HttpBadRequestError
  | HttpForbiddenError
  | HttpUnauthorizedError
  | HttpBadRequestError
  | HttpInternalServerError
  | HttpUnprocessableEntityError
  | HttpRedirectAttempt;

export class HttpRequestError extends Data.TaggedClass("HttpRequestError")<{
  message: string;
  options?: HttpResponseErrorOptions | undefined;
  cause?: unknown;
}> {}

interface HttpResponseErrorOptions extends ErrorOptions {
  readonly response?: Response;
}

export class HttpResponseError extends Data.TaggedClass("HttpResponseError")<{
  message: string;
  options?: HttpResponseErrorOptions | undefined;
  response?: Response;
}> {}

export class HttpNotFoundError extends Data.TaggedClass("HttpNotFoundError")<GenericError> {}

export class HttpBadRequestError extends Data.TaggedClass("HttpBadRequestError")<GenericError> {}

export class HttpUnauthorizedError extends Data.TaggedClass("HttpUnauthorizedError")<GenericError> {}

export class HttpForbiddenError extends Data.TaggedClass("HttpForbiddenError")<GenericError> {}

export class HttpInternalServerError extends Data.TaggedClass("HttpInternalServerError")<GenericError> {}

export class HttpUnprocessableEntityError extends Data.TaggedClass("HttpUnprocessableEntityError")<GenericError> {}

export class HttpRedirectAttempt extends Data.TaggedClass("HttpRedirectAttempt")<GenericError> {}

interface HttpParseErrorOptions extends ErrorOptions {
  readonly target: "json" | "text"; // add more as needed
  readonly raw?: unknown;
}

export class HttpParseError extends Data.TaggedClass("HttpParseError")<{
  target: "json" | "text";
  message: string;
  options?: HttpParseErrorOptions | undefined;
  cause?: unknown;
}> {}

export type HttpRequest = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
) => Effect.Effect<never, HttpError, Response>;

export const request = (...args: Parameters<HttpRequest>) => Effect.flatMap(HttpService, (s) => s.request(...args));

export const toJson = (res: Response) =>
  Effect.tryPromise({
    try: () => res.json() as Promise<unknown>,
    catch: (cause) =>
      new HttpParseError({
        message: "failed to parse json",
        cause,
        target: "json",
      }),
  });

export const toText = (res: Response) =>
  Effect.tryPromise({
    try: () => res.text(),
    catch: (cause) =>
      new HttpParseError({
        message: "failed to parse json",
        cause,
        target: "text",
      }),
  });

const isRequestError = (e: unknown): e is HttpRequestError => e instanceof HttpRequestError;
const isResponseError = (e: unknown): e is HttpResponseError => e instanceof HttpResponseError;

export const isRetriable = P.or(isRequestError, isResponseError);

const getResponseError = (response: Response) => {
  if (response.status < 400) {
    return new HttpRedirectAttempt({ response });
  }

  switch (response.status) {
    case 400:
      return new HttpBadRequestError({ response });

    case 401:
      return new HttpUnauthorizedError({ response });

    case 403:
      return new HttpForbiddenError({ response });

    case 404:
      return new HttpNotFoundError({ response });

    case 422:
      return new HttpUnprocessableEntityError({ response });
  }

  if (response.status >= 500) {
    return new HttpInternalServerError({ response });
  }

  return new HttpResponseError({
    message: `${response.status}: ${response.statusText}`,
    response,
  });
};

export const layer = Layer.succeed(HttpService, {
  /**
   *  Request can also receive an optional service HttpConfigService to create a 'client'
   */
  request: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
    pipe(
      Effect.serviceOption(HttpConfigService),
      Effect.flatMap((config) =>
        Effect.tryPromise({
          try: (signal) => {
            const baseUrl = pipe(
              config,
              O.flatMapNullable((c) => c.baseUrl),
              O.getOrUndefined,
            );

            const headers = pipe(
              config,
              O.flatMapNullable((c) => c.headers),
              O.map((h) => new Headers(h)),
              O.getOrElse(() => new Headers()),
            );

            const req = new Request(
              input instanceof Request
                ? input.clone()
                : new URL(input, baseUrl),
              { ...init, signal },
            );

            for (const [key, value] of headers.entries()) {
              req.headers.append(key, value);
            }

            return fetch(req);
          },
          catch: (cause) =>
            new HttpRequestError({
              message: cause instanceof DOMException
                ? "request was aborted"
                : "request malformed -- TypeError",
              cause,
            }),
        })
      ),
      Effect.filterOrElse(
        (res) => res.ok,
        (res) => Effect.fail(getResponseError(res)),
      ),
    ),
});
