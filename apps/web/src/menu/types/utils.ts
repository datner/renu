export type Nullish<T> = T | null | undefined
export type Unarray<T> = T extends Array<infer E> ? E : T
