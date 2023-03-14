import * as Brand from "@effect/data/Brand"

export type Int = number & Brand.Brand<"Int">
export const Int = Brand.refined<Int>(
  (n) => Number.isInteger(n),
  (n) => Brand.error(`Expected ${n} to be an integer`)
)

export type Positive = number & Brand.Brand<"Positive">
export const Positive = Brand.refined<Positive>(
  (n) => n > 0,
  (n) => Brand.error(`Expected ${n} to be positive`)
)

export type NonNegative = number & Brand.Brand<"NonNegative">
export const NonNegative = Brand.refined<NonNegative>(
  (n) => n >= 0,
  (n) => Brand.error(`Expected ${n} to be non-negative`)
)

export type PositiveInt = Positive & Int
export const PositiveInt = Brand.all(Int, Positive)

export type NonNegativeInt = NonNegative & Int
export const NonNegativeInt = Brand.all(Int, NonNegative)
