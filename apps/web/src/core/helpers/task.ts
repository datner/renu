import { Task } from "fp-ts/Task"

export const taskify =
  <A extends any[], B>(f: (...args: A) => Promise<B>) =>
  (...args: A): Task<B> =>
  () =>
    f(...args)
