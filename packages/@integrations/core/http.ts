import * as Layer from "@effect/io/Layer"
import * as Effect from "@effect/io/Effect"
import * as Context from "@effect/data/Context"
import * as O from "@effect/data/Option"
import { pipe } from "@effect/data/Function"

export interface HttpConfig {
  readonly baseUrl?: string
  readonly headers?: HeadersInit
}

export interface HttpConfigService {
  readonly baseUrl?: string
  readonly headers?: HeadersInit
}
export const HttpConfigService = Context.Tag<HttpConfigService>()

export interface HttpService {
  request: HttpRequest
}
export const HttpService = Context.Tag<HttpService>()
export const Tag = HttpService

export class HttpError extends Error {}

export class HttpRequestError extends HttpError {
  readonly _tag = "HttpRequestError"
}

interface HttpResponseErrorOptions extends ErrorOptions {
  readonly response?: Response
}

export class HttpResponseError extends HttpError {
  constructor(readonly message: string, readonly options?: HttpResponseErrorOptions | undefined) {
    super(message, options)
  }
}

export class HttpNotFoundError extends HttpResponseError {
  readonly _tag = "HttpNotFoundError"
}

interface HttpParseErrorOptions extends ErrorOptions {
  readonly target: "json" | "text" // add more as needed
  readonly raw?: unknown
}

export class HttpParseError extends HttpError {
  readonly _tag = "HttpParseError"
  constructor(message?: string | undefined, public options?: HttpParseErrorOptions | undefined) {
    super(message, options)
  }
}

export type HttpRequest = (
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) => Effect.Effect<HttpConfigService, HttpError, Response>

export const request = (...args: Parameters<HttpRequest>) =>
  Effect.serviceWithEffect(HttpService, (s) => s.request(...args))

export const HttpFetchService = Effect.serviceWith(
  HttpConfigService,
  (c): HttpService => ({
    request: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
      pipe(
        Effect.tryCatchPromiseInterrupt(
          (signal) => {
            const req = new Request(
              input instanceof Request ? input.clone() : new Request(new URL(input, c.baseUrl)),
              { ...init, signal }
            )

            for (const [key, value] of new Headers(c.headers).entries()) {
              req.headers.append(key, value)
            }

            return fetch(req)
          },
          (cause) => new HttpRequestError("http request returned bad response", { cause })
        ),
        Effect.flatMap((res) =>
          res.status === 404
            ? Effect.fail(new HttpNotFoundError(`url ${res.url} returned 404`, { response: res }))
            : Effect.succeed(res)
        )
      ),
  })
)

export const toJson = (res: Response) =>
  Effect.tryCatchPromise(
    () => res.json() as Promise<unknown>,
    (cause) => new HttpParseError("failed to parse json", { cause, target: "json" })
  )

export const toText = (res: Response) =>
  Effect.tryCatchPromise(
    () => res.text(),
    (cause) => new HttpParseError("failed to parse json", { cause, target: "text" })
  )

export const layer = Layer.succeed(HttpService, {
  /**
   *  Request can also receive an optional service HttpConfigService to create a 'client'
   */
  request: (input: RequestInfo | URL, init?: RequestInit | undefined) =>
    pipe(
      Effect.map(Effect.context<never>(), Context.getOption(HttpConfigService)),
      Effect.flatMap((config) =>
        Effect.tryCatchPromiseInterrupt(
          (signal) => {
            const baseUrl = pipe(
              config,
              O.flatMapNullable((c) => c.baseUrl),
              O.getOrUndefined
            )

            const headers = pipe(
              config,
              O.flatMapNullable((c) => c.headers),
              O.map((h) => new Headers(h)),
              O.getOrElse(() => new Headers())
            )

            const req = new Request(
              input instanceof Request ? input.clone() : new URL(input, baseUrl),
              { ...init, signal }
            )

            for (const [key, value] of headers.entries()) {
              req.headers.append(key, value)
            }

            return fetch(req)
          },
          (cause) => new HttpRequestError("http request returned bad response", { cause })
        )
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.succeed(response),
          Effect.filterOrFail(
            (res) => res.ok,
            () =>
              new HttpResponseError(`url ${response.url}  returned a bad response`, {
                response,
              })
          ),
          Effect.filterOrFail(
            (res) => res.status !== 404,
            () => new HttpNotFoundError(`url ${response.url} returned 404`, { response })
          )
        )
      )
    ),
})

export const Layers = {
  HttpFetchLayer: Layer.effect(HttpService, HttpFetchService),
  BasicHttpLayer: pipe(
    Layer.succeed(HttpConfigService, {}),
    Layer.provideMerge(Layer.effect(HttpService, HttpFetchService))
  ),
}
