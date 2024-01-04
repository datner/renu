import { Context, Duration, Effect, Function, pipe, Predicate, Ref, Schedule } from "effect";

export class CircuitBreakerError extends Error {
  readonly _tag = "CircuitBreakerError";
}

export interface BreakerConfig {
  name?: string;
  maxFailure?: number;
  cooldown?: Duration.Duration;
  retry?: Schedule.Schedule<unknown, unknown, unknown>;
  state?: Ref.Ref<BreakerState>;
}

const now = () => Duration.millis(Date.now());

const matchImpl = (onClosed: (s: BreakerClosed) => any, onOpen: (s: BreakerOpen) => any) => (s: BreakerState) =>
  s._tag === "BreakerClosed" ? onClosed(s) : onOpen(s);

export const matchBreaker: <A>(
  onClosed: (s: BreakerClosed) => A,
  onOpen: (s: BreakerOpen) => A,
) => (breakerState: BreakerState) => A = matchImpl;

export const matchBreakerW: <A, B, C>(
  onClosed: (s: BreakerClosed) => A,
  onOpen: (s: BreakerOpen) => C,
) => (breakerState: BreakerState) => A | B | C = matchImpl;

export const foldBreaker: <R1, E1, A, R2, E2, B>(
  onClosed: (s: BreakerClosed) => Effect.Effect<R1, E1, A>,
  onOpen: (s: BreakerOpen) => Effect.Effect<R2, E2, B>,
) => (breakerState: BreakerState) => Effect.Effect<R1 | R2, E1 | E2, A | B> = matchImpl;

export class BreakerOpen {
  readonly _tag = "BreakerOpen";
  readonly endTime = Duration.sum(this.fromNow, now());
  constructor(private readonly fromNow: Duration.Duration) {}
}

export class BreakerClosed {
  readonly _tag = "BreakerClosed";
  constructor(public readonly failCount: number) {}
}

export type BreakerState = BreakerOpen | BreakerClosed;

export const open = (fromNow: Duration.Duration): BreakerState => new BreakerOpen(fromNow);
export const closed = (failCount: number): BreakerState => new BreakerClosed(failCount);

export const onClosed = <A>(onClosed: (s: BreakerClosed) => A) => (s: BreakerState) =>
  s._tag === "BreakerClosed" ? onClosed(s) : s;

export const onOpen = <A>(onOpen: (s: BreakerOpen) => A) => (s: BreakerState) =>
  s._tag === "BreakerOpen" ? onOpen(s) : s;

export interface BreakerStateService {
  state: Ref.Ref<BreakerState>;
}
export const BreakerStateService = Context.Tag<BreakerStateService>();

export const initState = Ref.make(closed(0));

export const makeBreakerStateProvider = () =>
  pipe(
    initState,
    Effect.tap(() => Effect.log("Create new breaker state")),
    Effect.map((state) => Effect.provideService(BreakerStateService, { state })),
  );

export const defaultSchedule = pipe(
  Schedule.exponential(Duration.millis(10), 2),
  Schedule.either(Schedule.spaced(Duration.seconds(1))),
  Schedule.upTo(Duration.seconds(30)),
);

export type CircuitBreaker = <E>(
  isRetryable: Predicate.Predicate<E>,
) => <R, A>(
  self: Effect.Effect<R, E, A>,
) => Effect.Effect<R, E | CircuitBreakerError, A>;

const isClosed = (s: BreakerState) => s._tag === "BreakerClosed";

export const makeBreaker = (config?: BreakerConfig | undefined) =>
  Effect.gen(function*($) {
    const {
      name = "Anonymous",
      maxFailure = 3,
      cooldown = Duration.seconds(10),
      retry = defaultSchedule,
      state = yield* $(Ref.make(closed(0))),
    } = config ?? {};

    return <E, EI extends E>(isRetryable: Predicate.Predicate<EI> = Function.constFalse) =>
    <R, A>(self: Effect.Effect<R, E, A>) =>
      pipe(
        Ref.updateAndGet(
          state,
          onOpen((
            s,
          ) => (Duration.lessThan(s.endTime, now()) ? closed(maxFailure) : s)),
        ),
        Effect.flatMap(
          foldBreaker(
            () =>
              Effect.tapError(self, (e) =>
                Ref.update(
                  state,
                  onClosed((s) =>
                    (!isRetryable || isRetryable(e as EI)) && s.failCount < maxFailure
                      ? closed(s.failCount + 1)
                      : open(cooldown)
                  ),
                )),
            () => Effect.fail(new CircuitBreakerError(`Breaker ${name} is open`)),
          ),
        ),
        Effect.retry(
          Schedule.checkEffect(
            retry as Schedule.Schedule<R, CircuitBreakerError | E, A>,
            () => Effect.map(Ref.get(state), isClosed),
          ),
        ),
        Effect.tap(() => Ref.set(state, closed(0))),
      );
  });
