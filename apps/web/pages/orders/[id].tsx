import { invoke, useQuery } from "@blitzjs/rpc";
import { absurd } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";
import * as Match from "@effect/match";
import * as Schema from "@effect/schema/Schema";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import * as Presto from "@integrations/presto";
import { Button, Textarea } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { InferGetServerSidePropsType } from "next";
import { ReactNode, Suspense } from "react";
import ReactConfetti from "react-confetti";
import { useForm } from "react-hook-form";
import { Order, Venue } from "shared";
import { schemaResolver } from "shared/effect/Schema";
import { gSSP } from "src/blitz-server";
import { Renu } from "src/core/effect";
import sendComment from "src/menu/mutations/sendComment";
import getOrderStatus from "src/orders/queries/getOrderStatus";

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

interface OrderStatusProps {
  icon: ReactNode;
  children: ReactNode;
}

function OrderStatus(props: OrderStatusProps) {
  const { icon, children } = props;
  return (
    <div className="grow flex items-center place-self-center min-h-0">
      <div className="p-4">
        {icon}
        <div className="mt-3 text-center sm:mt-5">
          {children}
        </div>
      </div>
    </div>
  );
}

const Form = Schema.struct({
  comment: Schema.string,
});

function TooEarly() {
  return (
    <OrderStatus
      icon={
        <div className="mx-auto flex items-center content-center justify-center h-12 w-12 rounded-full bg-yellow-100">
          <QuestionMarkCircleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-gray-500">
          Huh? This is odd! You were not supposed to get here in this state. Please come back later
        </p>
      </div>
    </OrderStatus>
  );
}

function BadOrder() {
  return (
    <OrderStatus
      icon={
        <div className="mx-auto flex items-center content-center justify-center h-12 w-12 rounded-full bg-red-100">
          <ExclamationCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
      }
    >
      <>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Sorry!</h3>
        <div className="py-2">
          <p className="text-sm text-gray-500">
            The order was cancelled, no worried, you were either refunded or not charged at all
          </p>
        </div>
      </>
    </OrderStatus>
  );
}

function OrderProcessing() {
  return (
    <OrderStatus
      icon={
        <div className="mx-auto flex items-center content-center justify-center h-12 w-12 rounded-full bg-yellow-100">
          <QuestionMarkCircleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
      }
    >
      <>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Loading...</h3>
        <div className="py-2">
          <p className="text-sm text-gray-500">
            We are processing your order, we will be done in just a bit
          </p>
        </div>
      </>
    </OrderStatus>
  );
}

function OrderDelivered(props: Props) {
  const { order } = props;
  const { id } = order;
  const form = useForm({
    resolver: schemaResolver(Form),
  });

  const size = useViewportSize();

  return (
    <>
      <ReactConfetti {...size} />
      <OrderStatus
        icon={
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
        }
      >
        <>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order successful!</h3>
          <h4 className="text-md leading-6 font-medium text-gray-900">Order Number: {id}</h4>
          <p className="text-sm text-gray-500">
            Thank you for using Renu, we are still in very early rollout. We know you have something to say about the
            service, please tell us here (we actually read it, we get it straight to our phones!)
          </p>
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
        </>
      </OrderStatus>
    </>
  );
}

function OrderStatusPage(props: Props) {
  const { order } = props;
  const [status] = useQuery(getOrderStatus, order.id, {
    refetchInterval: (state) => {
      if (!state || ["PaidFor", "Confirmed", "Unconfirmed"].includes(state)) {
        return 700;
      }
      return false;
    },
  });

  switch (status) {
    case "Init": {
      return <TooEarly />;
    }
    case "Dead":
    case "Cancelled":
    case "Refunded": {
      return <BadOrder />;
    }

    case "PaidFor":
    case "Unconfirmed": {
      return <OrderProcessing />;
    }

    case "Confirmed":
    case "Delivered": {
      return <OrderDelivered order={order} />;
    }

    default:
      throw absurd(status);
  }
}

function CheckingOrderStatus(props: Props) {
  const { order } = props;
  return (
    <div className="grow flex items-center place-self-center min-h-0">
      <div className="p-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Checking Order number {order.id}!</h3>
          <div className="py-2">
            <p className="text-sm text-gray-500">
              Thank you for using Renu, we are still in very early rollout. We know you have something to say about the
              service, please tell us here (we actually read it, we get it straight to our phones!)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderId(props: Props) {
  const { order } = props;
  return (
    <Suspense fallback={<CheckingOrderStatus order={order} />}>
      <OrderStatusPage order={order} />
    </Suspense>
  );
}

export const getServerSideProps = gSSP((ctx) =>
  Option.fromNullable(ctx.params?.["id"]).pipe(
    Option.filter(_ => _ === ctx.query["more_info"]),
    Effect.flatMap(Schema.parse(Schema.NumberFromString)),
    Effect.flatMap(Order.getById),
    Effect.flatMap(Schema.decode(Order.Schema)),
    Effect.tap(Effect.log),
    Effect.tap(() => Effect.log(ctx.query)),
    Effect.tap((_) =>
      Effect.if(
        Option.isSome(_.txId),
        {
          onTrue: Effect.unit,
          onFalse: Option.fromNullable(ctx.query["transaction_uid"]).pipe(
            Effect.tap(() => Effect.log("updating transaction_uid")),
            Effect.flatMap(Schema.parse(Order.TxId)),
            Effect.flatMap(txId => Order.setTransactionId(_.id, txId)),
            Effect.flatMap(_ => Venue.getManagement(_.venueId)),
            Effect.map(_ => _.provider),
            Effect.flatMap(provider =>
              Match.value(provider).pipe(
                Match.when("PRESTO", () => Effect.flatMap(Presto.Presto, p => p.postOrder(_.id))),
                Match.orElse(() => Effect.dieMessage("unsupported")),
              )
            ),
          ),
        },
      )
    ),
    Effect.tap(() =>
      Effect.sync(() => {
        ctx.res.setHeader(
          "Cache-Control",
          "public, s-maxage=3600, stale-while-revalidate=10800",
        );
      })
    ),
    Effect.flatMap(Schema.encode(Order.Schema)),
    Effect.match({
      onSuccess: order => ({
        props: { order },
      }),
      onFailure: () => ({
        notFound: true,
      } as const),
    }),
    Renu.runPromise$,
  )
);

export default OrderId;
