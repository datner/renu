import * as Cause from "@effect/io/Cause"
import * as Schedule from "@effect/io/Schedule"
import * as Ref from "@effect/io/Ref"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import { pipe, constFalse, constTrue } from "@fp-ts/data/Function"
import * as Duration from "@fp-ts/data/Duration"
import * as Context from "@fp-ts/data/Context"
import * as Predicate from "@fp-ts/data/Predicate"
import { taggedError, InferError } from "shared/errors"
import * as B from "@fp-ts/data/Boolean"
import { TaggedError } from "shared/errors"
import { Common } from "."

interface BreakerService {
  breakerCircuit: <R, E, A>(that: Effect.Effect<R, E, A>) => Effect.Effect<R, E | "breaker", A>
}
const BreakerService = Context.Tag<BreakerService>()

export const breakerError = taggedError("BreakerError")
export type BreakerError = InferError<typeof breakerError>

export type BreakerOpen = {
  _tag: "BreakerOpen"
  endTime: Duration.Duration
}

export type BreakerClosed = {
  _tag: "BreakerClosed"
  failCount: number
}

export type BreakerState = BreakerOpen | BreakerClosed

export interface BreakerConfigService {
  maxFailure: number
  cooldown: Duration.Duration
}
export const BreakerConfigService = Context.Tag<BreakerConfigService>()

const now = () => Duration.millis(Date.now())

const matchImpl =
  (onClosed: (s: BreakerClosed) => any, onOpen: (s: BreakerOpen) => any) => (s: BreakerState) =>
    s._tag === "BreakerClosed" ? onClosed(s) : onOpen(s)

export const matchBreaker: <A>(
  onClosed: (s: BreakerClosed) => A,
  onOpen: (s: BreakerOpen) => A
) => (breakerState: BreakerState) => A = matchImpl

export const matchBreakerW: <A, B, C>(
  onClosed: (s: BreakerClosed) => A,
  onOpen: (s: BreakerOpen) => C
) => (breakerState: BreakerState) => A | B | C = matchImpl

export const foldBreaker: <R, E, A>(
  onClosed: (s: BreakerClosed) => Effect.Effect<R, E, A>,
  onOpen: (s: BreakerOpen) => Effect.Effect<R, E, A>
) => (breakerState: BreakerState) => Effect.Effect<R, E, A> = matchImpl

export const foldBreakerW: <R1, E1, A, R2, E2, B>(
  onClosed: (s: BreakerClosed) => Effect.Effect<R1, E1, A>,
  onOpen: (s: BreakerOpen) => Effect.Effect<R1, E2, B>
) => (breakerState: BreakerState) => Effect.Effect<R1 | R2, E1 | E2, A | B> = matchImpl

export const open = (fromNow: Duration.Duration): BreakerState => ({
  _tag: "BreakerOpen",
  endTime: Duration.add(now())(fromNow),
})

export const closed = (failCount: number): BreakerState => ({
  _tag: "BreakerClosed",
  failCount,
})

export const onClosed =
  <A>(onClosed: (s: BreakerClosed) => A) =>
  (s: BreakerState) =>
    s._tag === "BreakerClosed" ? onClosed(s) : s

export const onOpen =
  <A>(onOpen: (s: BreakerOpen) => A) =>
  (s: BreakerState) =>
    s._tag === "BreakerOpen" ? onOpen(s) : s

export interface BreakerStateService {
  state: Ref.Ref<BreakerState>
}
export const BreakerStateService = Context.Tag<BreakerStateService>()

export const Layers = {
  DefaultBreakerState: pipe(
    Ref.make(closed(0)),
    Effect.map((state) => ({ state })),
    Layer.fromEffect(BreakerStateService)
  ),
}

export const breaker =
  <E extends TaggedError>(pred: Predicate.Predicate<Cause.Cause<E>>) =>
  <R, A>(effect: Effect.Effect<R, E, A>) =>
    Effect.gen(function* ($) {
      const config = yield* $(Effect.service(BreakerConfigService))
      const { name } = yield* $(Effect.service(Common.IdentityService))
      const { retry } = yield* $(Effect.service(Common.ScheduleService))
      const { state } = yield* $(Effect.service(BreakerStateService))

      const fail = pipe(
        state,
        Ref.update(
          onClosed((s) =>
            s.failCount < config.maxFailure ? closed(s.failCount + 1) : open(config.cooldown)
          )
        )
      )

      return yield* $(
        pipe(
          state,
          Ref.updateAndGet(
            onOpen((s) =>
              pipe(
                s.endTime,
                Duration.greaterThanOrEqualTo(now()),
                B.match(
                  () => closed(config.maxFailure),
                  () => s
                )
              )
            )
          ),
          Effect.flatMap(
            foldBreaker<R, E | BreakerError, A>(
              () =>
                pipe(
                  effect,
                  Effect.onError((e) => (pred(e) ? fail : Effect.never()))
                ),
              () => Effect.fail(breakerError(new Error(`Breaker ${name} is open`)))
            )
          ),
          Effect.retry(
            pipe(
              retry,
              Schedule.checkEffect<E | BreakerError, A, never>(() =>
                pipe(Ref.get(state), Effect.map(matchBreaker(constTrue, constFalse)))
              )
            )
          ),
          Effect.tap(() => Ref.set(closed(0))(state))
        )
      )
    })
