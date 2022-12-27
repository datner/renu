// @vitest-environment node
import { describe, it, vi, beforeEach, afterEach, expect, Mock } from "vitest"
import * as RIO from "fp-ts/IORef"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { HttpClientRequestError, HttpResponse } from "./httpClient"
import {
  BreakerState,
  breakerState,
  CircuitBreaker,
  circuitBreaker,
  closed,
  opened,
  singletonBreaker,
} from "./circuitBreaker"
import { pipe } from "fp-ts/function"
import { BreakerError, HttpContentError, HttpServerError } from "./httpErrors"
import { secondsToMilliseconds } from "date-fns"

type Context = {
  breaker: CircuitBreaker
  state: RIO.IORef<BreakerState>
  req: TE.TaskEither<BreakerError | HttpClientRequestError | HttpContentError<"text">, string>
  request: Mock
  expectError: () => Promise<void>
  expectOpen: () => Promise<void>
  expectSuccess: () => Promise<void>
}

const success = <E, A>() => TE.right<E, A>("success" as A)
const successResponse = TE.right({ tag: "HttpResponse", text: success() } as HttpResponse)
const failureResponse = TE.left({
  tag: "HttpServerError",
  error: "server unreachable",
} as HttpServerError)

describe("circuitBreaker", () => {
  beforeEach<Context>(async (ctx) => {
    ctx.request = vi.fn()
    ctx.state = breakerState()
    ctx.breaker = circuitBreaker("test")
    ctx.req = pipe(
      ctx.breaker(ctx.state)("test")({
        httpClient: { request: () => ctx.request },
        circuitBreakerOptions: { resetTimeoutSecs: 1, maxBreakerRetries: 1 },
      }),
      TE.chainW((res) => res.text)
    )

    ctx.expectSuccess = () => ctx.expect(ctx.req()).resolves.toStrictEqual(E.right("success"))
    ctx.expectError = () =>
      ctx.expect(ctx.req()).resolves.toMatchObject(E.left({ tag: "HttpServerError" }))
    ctx.expectOpen = () =>
      ctx.expect(ctx.req()).resolves.toMatchObject(E.left({ tag: "BreakerError" }))

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers().resetAllMocks()
  })

  it<Context>("should allow request when closed", async (ctx) => {
    ctx.request.mockReturnValueOnce(successResponse)
    await ctx.expectSuccess()
    expect(ctx.state.read()).toStrictEqual(closed(0))
  })

  it<Context>("should instant fail when open", async (ctx) => {
    ctx.state.write(opened(1))()

    ctx.request.mockReturnValueOnce(successResponse)
    await ctx.expectOpen()
    expect(ctx.state.read()).toStrictEqual(opened(1))
    expect(ctx.request).toBeCalledTimes(0)
  })

  it<Context>("should flip to open after max failures", async (ctx) => {
    ctx.request.mockReturnValue(failureResponse)
    await ctx.expectError()
    await ctx.expectOpen()
    expect(ctx.state.read()).toStrictEqual(opened(1))
  })

  it<Context>("should flip to closed after a half-open success", async (ctx) => {
    ctx.state.write(opened(1))()
    ctx.request.mockReturnValueOnce(successResponse)
    await ctx.expectOpen()
    vi.advanceTimersByTime(secondsToMilliseconds(2))
    await ctx.expectSuccess()
    expect(ctx.request).toHaveBeenCalledOnce()
  })

  it<Context>("should refresh opened after a half-open failure", async (ctx) => {
    ctx.state.write(opened(1))()
    ctx.request.mockReturnValueOnce(failureResponse)
    await ctx.expectOpen()
    vi.advanceTimersByTime(secondsToMilliseconds(2))
    await ctx.expectError()
    await ctx.expectOpen()
    expect(ctx.request).toHaveBeenCalledOnce()
  })

  describe("singletonBreaker", () => {
    beforeEach<Context>((ctx) => {
      ctx.req = pipe(
        singletonBreaker("singletonBreaker")("test")({
          httpClient: { request: () => ctx.request },
          circuitBreakerOptions: {
            resetTimeoutSecs: 1,
            maxBreakerRetries: 1,
          },
        }),
        TE.chainW((res) => res.text)
      )
    })

    it<Context>("should allow request when closed", async (ctx) => {
      ctx.request.mockReturnValueOnce(successResponse)
      await ctx.expectSuccess()
    })

    it<Context>("should flip to open on max failures and block requests", async (ctx) => {
      ctx.request.mockReturnValue(failureResponse)
      await ctx.expectError()
      await ctx.expectOpen()
      expect(ctx.request).toHaveBeenCalledOnce()
    })

    it<Context>("should flip to closed after a half-open success", async (ctx) => {
      ctx.request.mockReturnValueOnce(failureResponse).mockReturnValueOnce(successResponse)
      await ctx.expectError()
      await ctx.expectOpen()
      vi.advanceTimersByTime(secondsToMilliseconds(2))
      await ctx.expectSuccess()
      expect(ctx.request).toHaveBeenCalledTimes(2)
    })

    it<Context>("should refresh opened after a half-open failure", async (ctx) => {
      ctx.request.mockReturnValue(failureResponse)
      await ctx.expectError()
      await ctx.expectOpen()
      vi.advanceTimersByTime(secondsToMilliseconds(2))
      await ctx.expectError()
      await ctx.expectOpen()
      expect(ctx.request).toHaveBeenCalledTimes(2)
    })
  })
})
