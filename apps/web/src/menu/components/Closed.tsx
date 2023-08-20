import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Predicate from "@effect/data/Predicate";
import { Container } from "@mantine/core";

type Props = {
  venue: O.Option<string>;
};

export function Closed(props: Props) {
  const venue = pipe(
    props.venue,
    O.fromNullable,
    O.filter(Predicate.isString),
    O.getOrElse(() => "the venue"),
  );

  return (
    <div className="pt-20 pb-32 bg-emerald-600 h-full">
      <Container>
        <Label />
        <div className="px-2 text-center">
          <h2 className="text-center text-emerald-100 font-black text-xl xs:text-4xl">
            Oops, {venue} is not accepting orders right now
          </h2>
          <p className="mt-4 text-emerald-200">Please check back later! :)</p>
        </div>
      </Container>
    </div>
  );
}

const Label = () => (
  <div className="text-center font-title overflow-visible font-black text-6xl xs:text-7xl leading-none mb-16 text-emerald-300">
    Sorry, Were Closed!
  </div>
);
