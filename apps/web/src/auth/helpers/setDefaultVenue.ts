import { AuthenticatedCtx } from "blitz";
import { Venue } from "database";

export function setDefaultVenue<T extends object, V extends Venue = Venue>(
  input: T,
  { session }: AuthenticatedCtx,
): T & { venue: V } {
  if ("venue" in input) {
    // Pass through the input
    return input as T & { venue: V };
  } else {
    return { ...input, venue: session.venue as V };
  }
}
