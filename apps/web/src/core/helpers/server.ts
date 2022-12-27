import { log as bLog } from "blitz"
import { IO } from "fp-ts/IO"

export const success =
  (a: string): IO<void> =>
  () =>
    bLog.success(a)

export const error =
  (a: string): IO<void> =>
  () =>
    bLog.error(a)

export const debug =
  (a: string): IO<void> =>
  () =>
    bLog.debug(a)

export const progress =
  (a: string): IO<void> =>
  () =>
    bLog.progress(a)

export const spinner =
  (a: string): IO<void> =>
  () =>
    bLog.spinner(a)

export const branded =
  (a: string): IO<void> =>
  () =>
    bLog.branded(a)

export const clearLine =
  (a?: string | undefined): IO<void> =>
  () =>
    bLog.clearLine(a)

export const clearConsole = bLog.clearConsole
export const variable: <A>(a: A) => string = bLog.variable
export const greenText = bLog.greenText
export const withBrand = bLog.withBrand
export const withCaret = bLog.withCaret
