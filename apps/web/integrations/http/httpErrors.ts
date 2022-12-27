type ParseTarget = "json" | "text"

export type HttpContentError<Target extends ParseTarget = ParseTarget> = {
  tag: "HttpContentError"
  target: Target
  raw: unknown
  error: unknown
}

const taggedError =
  <T extends string>(tag: T) =>
  (error: unknown): TaggedError<T> => ({
    tag,
    error,
  })

type InferError<E extends ReturnType<typeof taggedError>> = ReturnType<E>

type TaggedError<T extends string> = {
  tag: T
  error: unknown
}

export type BreakerError = InferError<typeof breakerError>
export const breakerError = taggedError("BreakerError")

export type HttpRequestError = InferError<typeof httpRequestError>
export const httpRequestError = taggedError("HttpRequestError")

export type HttpClientError = InferError<typeof httpClientError>
export const httpClientError = taggedError("HttpClientError")

export type HttpServerError = InferError<typeof httpServerError>
export const httpServerError = taggedError("HttpServerError")

export type HttpError =
  | HttpRequestError
  | HttpServerError
  | HttpClientError
  | HttpContentError
  | BreakerError
