import { type RpcClient, invalidateQuery, setQueryData } from "@blitzjs/rpc"
import type { AsyncFunc } from "blitz"
import { Task } from "fp-ts/Task"

type Resolver<TInput, TResult> = (input: TInput, ctx?: any) => Promise<TResult>
type MutateOptions = {
  refetch?: boolean
}

export const fpInvalidateQuery =
  <TInput, TResult, T extends AsyncFunc>(
    resolver: T | Resolver<TInput, TResult> | RpcClient<TInput, TResult>,
    params?: TInput
  ): Task<void> =>
  () =>
    invalidateQuery(resolver, params)

export const fpSetQueryData =
  <TInput, TResult, T extends AsyncFunc>(
    resolver: T | Resolver<TInput, TResult> | RpcClient<TInput, TResult>,
    params: TInput,
    newData: TResult | ((oldData: TResult | undefined) => TResult),
    opts?: MutateOptions
  ): Task<void> =>
  () =>
    // return type is Promise<void | Promise<void>
    // this flattens it to just Promise<void>
    (async () => await setQueryData(resolver, params, newData, opts))()
