import { Schema } from "@effect/schema";
import {
  ManagementCategory,
  ManagementItem,
  ManagementMenu,
  ManagementModifier,
  ManagementModifierOption,
} from "@integrations/core/management";
import { Option, pipe, ReadonlyArray } from "effect";

const MangledNumberish = Schema.union(Schema.NumberFromString, Schema.number, Schema.undefined);

const DorixPrice = Schema.struct({
  inplace: MangledNumberish,
  ta: MangledNumberish,
  delivery: MangledNumberish,
  pickup: MangledNumberish,
});

const DorixAnswer = Schema.struct({
  id: Schema.string,
  name: Schema.string,
  price: Schema.optional(pipe(DorixPrice, Schema.partial)),
});

const DorixQuestion = Schema.struct({
  name: Schema.string,
  mandatory: Schema.boolean,
  answerLimit: Schema.string.pipe(
    Schema.compose(Schema.NumberFromString),
    Schema.nonNaN(),
    Schema.finite(),
  ),
  items: Schema.array(DorixAnswer),
});

export const DorixItem = Schema.struct({
  _id: Schema.string,
  price: Schema.optional(pipe(DorixPrice, Schema.partial)),
  name: Schema.string,
  description: Schema.option(Schema.string),
  questions: Schema.option(
    Schema.struct({
      mandatory: pipe(
        DorixQuestion,
        Schema.omit("mandatory"),
        Schema.extend(Schema.struct({ mandatory: Schema.literal(true) })),
        Schema.array,
      ),
      optional: pipe(
        DorixQuestion,
        Schema.omit("mandatory"),
        Schema.extend(Schema.struct({ mandatory: Schema.literal(false) })),
        Schema.array,
      ),
    }),
  ),
});

export interface DorixItem extends Schema.Schema.To<typeof DorixItem> {}

export const DorixCategory = Schema.struct({
  _id: Schema.string,
  name: Schema.string,
  items: Schema.array(DorixItem),
});
export const DorixMenu = Schema.struct({
  _id: Schema.string,
  name: Schema.string,
  items: Schema.array(DorixCategory),
});
export interface DorixMenu extends Schema.Schema.To<typeof DorixMenu> {}

export const MenuResponse = Schema.union(
  Schema.struct({ ack: Schema.literal(true), data: Schema.struct({ menu: DorixMenu }) }),
  Schema.struct({ ack: Schema.literal(false), message: Schema.optional(Schema.string) }),
);

export interface MenuSuccess {
  ack: true;
  data: {
    menu: DorixMenu;
  };
}
export interface MenuError {
  ack: true;
  message?: string;
}
export type MenuResponse = MenuSuccess | MenuError;

export const toMenu = (dorix: DorixMenu): ManagementMenu => ({
  id: dorix._id,
  name: dorix.name,
  categories: pipe(
    dorix.items,
    ReadonlyArray.map(
      (c): ManagementCategory => ({
        id: c._id,
        name: c.name,
        items: pipe(
          c.items,
          ReadonlyArray.map(
            (i): ManagementItem => ({
              id: i._id,
              name: i.name,
              description: Option.getOrElse(i.description, () => ""),
              price: Number(i.price?.inplace ?? 0),
              modifiers: pipe(
                i.questions,
                Option.map((q) => ReadonlyArray.appendAll(q.optional, q.mandatory)),
                Option.map(
                  ReadonlyArray.map(
                    (m): ManagementModifier => ({
                      name: m.name,
                      max: m.answerLimit,
                      min: m.mandatory ? 1 : undefined,
                      options: pipe(
                        m.items,
                        ReadonlyArray.map(
                          (o): ManagementModifierOption => ({
                            id: o.id,
                            name: o.name,
                            price: pipe(
                              o.price?.inplace,
                              Schema.decodeOption(MangledNumberish),
                              Option.getOrUndefined,
                            ),
                          }),
                        ),
                      ),
                    }),
                  ),
                ),
                Option.getOrElse(() => []),
              ),
            }),
          ),
        ),
      }),
    ),
  ),
});
