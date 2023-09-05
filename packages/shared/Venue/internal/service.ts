import { Context } from "effect";
import type { Venues, VenuesService } from "../service";

export const tag = Context.Tag<Venues, VenuesService>("Venues");
