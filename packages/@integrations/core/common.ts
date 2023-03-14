import * as Layer from "@effect/io/Layer"
import * as Context from "@effect/data/Context"
import * as Schedule from "@effect/io/Schedule"
import * as Config from "@effect/io/Config"
import * as Duration from "@effect/data/Duration"
import { pipe } from "@fp-ts/core/Function"

export interface IdentityService {
  name: string
}
export const IdentityService = Context.Tag<IdentityService>()

export interface ScheduleService {
  retry: Schedule.Schedule<never, unknown, any>
}
export const ScheduleService = Context.Tag<ScheduleService>()

export const config = Config.all({
  host: Config.string("host"),
})

export const DefaultRetrySchedule: ScheduleService = {
  retry: pipe(
    Schedule.exponential(Duration.millis(10), 2),
    Schedule.either(Schedule.spaced(Duration.seconds(1))),
    Schedule.compose(Schedule.elapsed()),
    Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.seconds(30)))
  ),
}

export const Layers = {
  DefaultRetrySchedule: Layer.succeed(ScheduleService, DefaultRetrySchedule),
}
