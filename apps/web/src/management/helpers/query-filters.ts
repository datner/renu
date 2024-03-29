import { Prisma } from "database";
import { QueryFilter } from "src/core/helpers/prisma";

export const { ofVenue } = {
  ofVenue: (venueId: number) => ({
    venueId,
  }),
} satisfies Record<string, QueryFilter<Prisma.ManagementIntegrationWhereInput>>;
