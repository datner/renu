import { flow, pipe, constVoid } from "fp-ts/function"
import { isAfter, addSeconds, getTime, differenceInSeconds } from "date-fns/fp"
import * as IOR from "fp-ts/IORef"
import * as R from "fp-ts/Reader"
import * as RIO from "fp-ts/ReaderIO"
import * as B from "fp-ts/boolean"
import * as RTE from "fp-ts/ReaderTaskEither"
import { request } from "integrations/http/httpClient"
import { breakerError, BreakerError } from "integrations/http/httpErrors"
import { now } from "fp-ts/Date"
import { ManagementProvider, ClearingProvider } from "@prisma/client"

export type BreakerOptions = {
  maxBreakerRetries: number
  resetTimeoutSecs: number
}

type BreakerClosed = {
  tag: "BreakerClosed"
  failCount: number
}

type BreakerOpen = {
  tag: "BreakerOpen"
  endTime: number
}

export const opened = (secsFromNow: number): BreakerOpen => ({
  tag: "BreakerOpen",
  endTime: pipe(now(), addSeconds(secsFromNow), getTime),
})

export const closed = (failCount: number): BreakerClosed => ({
  tag: "BreakerClosed",
  failCount,
})

export type BreakerState = BreakerOpen | BreakerClosed

export const breakerState = IOR.newIORef<BreakerState>({ tag: "BreakerClosed", failCount: 1 })

export type CircuitBreaker = ReturnType<typeof circuitBreaker>

const foldBreakerState =
  <A>(
    onClosed: (s: BreakerClosed) => A,
    onOpen: (s: BreakerOpen) => A,
    onHalfOpen: (s: BreakerOpen) => A
  ) =>
  (state: BreakerState) => {
    switch (state.tag) {
      case "BreakerClosed":
        return onClosed(state)

      case "BreakerOpen":
        return pipe(
          now(),
          isAfter(state.endTime),
          B.fold(
            () => onOpen(state),
            () => onHalfOpen(state)
          )
        )
    }
  }

const rteBreakerError =
  (name: string) =>
  <R, E, A>(s: BreakerOpen) =>
    RTE.throwError<R, E | BreakerError, A>(
      breakerError(
        new Error(
          `breaker "${name}" tripped, resetting in ${differenceInSeconds(now())(s.endTime)} seconds`
        )
      )
    )

export type CircuitBreakerEnv = {
  circuitBreakerOptions: BreakerOptions
}

export const circuitBreaker = (name: string) => (state: IOR.IORef<BreakerState>) =>
  flow(request, (r) =>
    pipe(
      RTE.fromIO(state.read),
      RTE.chain(
        foldBreakerState(
          () => r,
          (s) => rteBreakerError(name)(s),
          () => r
        )
      ),
      RTE.orElseFirstW((e) =>
        pipe(
          RTE.fromIO(state.read),
          RTE.chainReaderIOK(
            foldBreakerState(
              (s) =>
                pipe(
                  RIO.asks<CircuitBreakerEnv, BreakerOptions>((e) => e.circuitBreakerOptions),
                  RIO.chainIOK((opts) =>
                    state.write(
                      s.failCount + 1 >= opts.maxBreakerRetries
                        ? opened(opts.resetTimeoutSecs)
                        : closed(s.failCount + 1)
                    )
                  )
                ),
              () => RIO.fromIO(constVoid),
              () =>
                pipe(
                  RIO.asks<CircuitBreakerEnv, number>(
                    (e) => e.circuitBreakerOptions.resetTimeoutSecs
                  ),
                  RIO.map(opened),
                  RIO.chainIOK(state.write)
                )
            )
          ),
          RTE.apSecond(RTE.throwError(e))
        )
      ),
      RTE.chainFirstIOK(() => state.write(closed(0)))
    )
  )

export const withBreakerOptions = <R extends {}>(circuitBreakerOptions: BreakerOptions) =>
  R.local((r: R) =>
    Object.assign(r, {
      circuitBreakerOptions,
    } as CircuitBreakerEnv)
  )

export const singletonBreaker = (name: string) => {
  const state = breakerState()
  return circuitBreaker(name)(state)
}

export const breakers = {
  DORIX: {
    maxBreakerRetries: 3,
    resetTimeoutSecs: 30,
  },
  PAY_PLUS: {
    maxBreakerRetries: 3,
    resetTimeoutSecs: 30,
  },
  RENU: {
    maxBreakerRetries: 3,
    resetTimeoutSecs: 30,
  },
  CREDIT_GUARD: {
    maxBreakerRetries: 3,
    resetTimeoutSecs: 30,
  },
} satisfies Record<ManagementProvider | ClearingProvider, BreakerOptions>
