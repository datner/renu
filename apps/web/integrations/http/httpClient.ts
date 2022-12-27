import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { OptionsInit } from "got"
import { Store } from "keyv"
import {
  HttpClientError,
  HttpContentError,
  HttpRequestError,
  HttpServerError,
} from "integrations/http/httpErrors"

export interface RequestOptions
  extends Pick<OptionsInit, "method" | "form" | "json" | "headers" | "searchParams"> {}

export type HttpResponse = {
  tag: "HttpResponse"
  json: TE.TaskEither<HttpContentError<"json">, unknown>
  text: TE.TaskEither<HttpContentError<"text">, string>
  status: number
  headers: Record<string, string | string[]>
  rawResponse: unknown
}

export type HttpClientRequest = (
  url: string | URL,
  optionsInit?: RequestOptions | undefined
) => RTE.ReaderTaskEither<HttpCacheEnv, HttpClientRequestError, HttpResponse>

export interface HttpClient {
  request: HttpClientRequest
}

export interface HttpClientEnv {
  httpClient: HttpClient
}

export interface HttpCacheEnv {
  cache?: Store<unknown>
}

export type HttpClientRequestError = HttpRequestError | HttpClientError | HttpServerError

export const request = (
  ...args: Parameters<HttpClientRequest>
): RTE.ReaderTaskEither<HttpClientEnv & HttpCacheEnv, HttpClientRequestError, HttpResponse> =>
  RTE.asksReaderTaskEitherW((env: HttpClientEnv) => env.httpClient.request(...args))
