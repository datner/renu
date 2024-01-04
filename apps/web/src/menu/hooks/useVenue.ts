import { createContext, useContext } from "react";
import { Venue } from "shared";

const noVenue = Symbol();
export const venueContext = createContext<Venue.Menu.Menu | typeof noVenue>(noVenue);

export const useVenue = () => {
  const venue = useContext(venueContext);
  if (venue === noVenue) {
    throw "Not inside a venue";
  }
  return venue;
};
