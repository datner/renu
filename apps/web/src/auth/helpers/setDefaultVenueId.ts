import { AuthenticatedCtx } from "blitz";

export function setDefaultVenueId<T extends object>(
  input: T,
  { session }: AuthenticatedCtx,
): T & { venueId: number } {
  if ("venueId" in input) {
    // Pass through the input
    return input as T & { venueId: number };
  } else {
    // Set organizationId to session.orgId
    return { ...input, venueId: session.venue.id };
  }
}
