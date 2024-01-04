import { invoke, useMutation, useQuery } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Button, Textarea } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import * as Match from "effect/Match";
import { Suspense } from "react";
import ReactConfetti from "react-confetti";
import { useForm } from "react-hook-form";
import { Order } from "shared";
import { schemaResolver } from "shared/effect/Schema";
import sendComment from "src/menu/mutations/sendComment";
import requestHelp from "src/orders/mutations/requestHelp";
import getOrder from "src/orders/queries/getOrder";

function OrderSuccess_() {
  const [q] = useQuery(getOrder, null);
  return message(q);
}

const Form = Schema.struct({
  comment: Schema.string,
});

const message = pipe(
  Match.type<Order.Decoded>(),
  Match.whenOr({ state: "Confirmed" }, { state: "Delivered" }, (_) => <SuccessMessage id={_.id} />),
  Match.orElse(() => <TooEarly />),
);

function TooEarly() {
  const [help, { isLoading, isIdle, isSuccess }] = useMutation(requestHelp);

  return (
    <div className="grow flex items-center justify-center place-self-center min-h-0">
      <div className="p-4">
        <div className="mx-auto flex items-center content-center justify-center h-12 w-12 rounded-full bg-yellow-100">
          <QuestionMarkCircleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order In Progress</h3>
          {isIdle || !isSuccess
            ? (
              <>
                <div className="py-2">
                  <p className="text-sm text-gray-500">
                    Huh? This is odd! You were not supposed to get here in this state. We apologize!
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    If you think this is a mistake, please press the button bellow and we will be notified and take care
                    of things.
                  </p>
                </div>
                <div>
                  <Button fullWidth onClick={() => help()} loading={isLoading} type="submit">
                    Help me!
                  </Button>
                </div>
              </>
            )
            : <p>We were notified, help is on the way.</p>}
        </div>
      </div>
    </div>
  );
}

interface SuccessMessageProps {
  id: number;
}

function SuccessMessage(props: SuccessMessageProps) {
  const { id } = props;
  const form = useForm({
    resolver: schemaResolver(Form),
  });

  const size = useViewportSize();

  return (
    <>
      <ReactConfetti {...size} />
      <div className="grow flex items-center place-self-center min-h-0">
        <div className="p-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Order successful!</h3>
            <h4 className="text-md leading-6 font-medium text-gray-900">Order Number: {id}</h4>
            <div className="py-2">
              <p className="text-sm text-gray-500">
                Thank you for using Renu, we are still in very early rollout. We know you have something to say about
                the service, please tell us here (we actually read it, we get it straight to our phones!)
              </p>
            </div>
            {form.formState.isSubmitSuccessful ? <div className="font-medium">Thank you so much!</div> : (
              <form
                className="space-y-2"
                onSubmit={form.handleSubmit((data) => invoke(sendComment, data))}
              >
                <Textarea {...form.register("comment")} placeholder="I loved it! but..." />
                <Button fullWidth loading={form.formState.isSubmitting} type="submit">
                  Submit
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function OrderSuccess() {
  return (
    <Suspense fallback={<div>wait...</div>}>
      <OrderSuccess_ />
    </Suspense>
  );
}

export default OrderSuccess;
