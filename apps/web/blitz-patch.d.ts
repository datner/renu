import { Ctx } from "@blitzjs/next";
import { FirstParam, PromiseReturnType } from "blitz";

declare module "@blitzjs/rpc" {
  declare function invoke<T extends (...args: any) => any, TInput = FirstParam<T>>(
    queryFn: T,
    params: TInput,
  ): Promise<PromiseReturnType<T>>;

  declare function invoke<T extends (...args: any) => any, TInput = FirstParam<T>>(
    queryFn: T,
    params: TInput,
    isServer: boolean,
  ): Promise<PromiseReturnType<T>>;

  declare function invokeWithCtx<T extends (...args: any) => any, TInput = FirstParam<T>>(
    queryFn: T,
    params: TInput,
    ctx: Ctx,
  ): Promise<PromiseReturnType<T>>;
}
export {};
