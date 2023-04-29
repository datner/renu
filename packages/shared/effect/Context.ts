import * as Context from "@effect/data/Context";
import * as Option from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";

export const access = <Id, Service>(tag: Context.Tag<Id, Service>) =>
  Effect.contextWithEffect((_: Context.Context<never>) => {
    const service = Context.getOption(_, tag);
    if (Option.isSome(service)) {
      return Effect.succeed(service.value);
    }
    return Effect.dieMessage("this effect needs to be executed in the right context");
  });

export const accessing = <Id, Service>(tag: Context.Tag<Id, Service>) => Effect.provideServiceEffect(tag, access(tag));
