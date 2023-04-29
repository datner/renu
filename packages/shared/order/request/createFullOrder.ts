import * as Data from "@effect/data/Data";
import * as Request from "@effect/io/Request";
import * as Models from "database";

export class CreateFullOrderError extends Data.TaggedClass("CreateFullOrderError")<{}> { }

export interface CreateFullOrder<Include extends Models.Prisma.OrderInclude = Models.Prisma.OrderInclude>
  extends Request.Request<CreateFullOrderError, Models.Prisma.OrderGetPayload<{ include: Include }>> {
  readonly _tag: "CreateFullOrder";
  readonly order: Models.Prisma.OrderCreateInput;
  readonly include?: Include;
}

export const CreateFullOrder = Request.tagged<CreateFullOrder>("CreateFullOrder");
