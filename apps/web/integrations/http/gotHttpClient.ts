import {
  HttpCacheEnv,
  HttpClient,
  HttpClientRequest,
  HttpResponse,
} from "integrations/http/httpClient"
import { got, HTTPError } from "got"
import * as J from "fp-ts/Json"
import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import { httpClientError, httpServerError } from "./httpErrors"
import { pipe } from "fp-ts/function"

const gotRequest: HttpClientRequest = (...args) =>
  pipe(
    RTE.asks((e: HttpCacheEnv) => e.cache),
    RTE.chainTaskEitherK((cache) =>
      TE.tryCatch(
        () => got.extend({ cache })(...args),
        (e) =>
          e instanceof HTTPError
            ? e.response.statusCode >= 500
              ? httpServerError(e)
              : httpClientError(e)
            : httpClientError(e)
      )
    ),
    RTE.map(
      (res) =>
        ({
          tag: "HttpResponse",
          status: res.statusCode,
          json: TE.fromEither(
            pipe(
              J.parse(res.body),
              E.mapLeft((error) => ({
                tag: "HttpContentError",
                target: "json",
                raw: res.body,
                error,
              }))
            )
          ),
          text: TE.of(res.body),
          headers: res.headers,
          rawResponse: res,
        } as HttpResponse)
    )
  )

export const gotClient: HttpClient = {
  request: gotRequest,
}
