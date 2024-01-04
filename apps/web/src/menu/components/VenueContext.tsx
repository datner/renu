import { ReactNode } from "react";
import { Venue } from "shared";
import { venueContext } from "src/menu/hooks/useVenue";

export const VenueContext = (props: { menu: Venue.Menu.Menu; children?: ReactNode }) => {
  return (
    <venueContext.Provider value={props.menu}>
      {props.children}
    </venueContext.Provider>
  );
};
