import { useParam } from "@blitzjs/next";
import { useMutation, useQuery } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { toast } from "react-toastify";
import { Item, ModifierConfig } from "shared";
import { Modifier } from "shared/Item";
import { FullItem } from "src/items/hooks/form";
import setModifierPrestoId from "src/items/mutations/setModifierPrestoId";
import setPrestoId from "src/items/mutations/setPrestoId";
import getItemNew from "src/items/queries/getItemNew";

export function PrestoIntegrationPanel() {
  const identifier = useParam("identifier", "string")!;
  const [item] = useQuery(getItemNew, identifier, { select: Schema.decodeSync(FullItem) });
  const [updatePrestoId] = useMutation(setPrestoId);
  const itemRep = item.managementRepresentation._tag === "Presto" ? item.managementRepresentation.id : undefined;
  const [id, setId] = useState(itemRep);

  return (
    <div onClick={e => e.stopPropagation()} className="p-8 flex flex-col gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Presto ID</span>
        </label>
        <div className="input-group">
          <input
            defaultValue={itemRep}
            onChange={e => setId(Number(e.currentTarget.value))}
            type="number"
            placeholder="1337"
            className="input input-primary input-bordered"
          />
          <button
            type="button"
            disabled={id == null || id === itemRep}
            onClick={() =>
              toast.promise(updatePrestoId({ id: item.id, prestoId: id! }), {
                pending: `setting item ${item.identifier} to presto id ${id!}...`,
                success: "Success!",
                error: "oh no",
              })}
            className="btn btn-square btn-primary"
          >
            <CheckIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {item.modifiers.map(m => <ModifierPrestoIdBlock modifier={m} />)}

      <pre className="max-w-xl">
        {JSON.stringify(item, null, 2)}
      </pre>
    </div>
  );
}

interface ModifierPrestoIdBlockProps {
  readonly modifier: Schema.To<typeof Item.Modifier.fromPrisma>;
}

function ModifierPrestoIdBlock(props: ModifierPrestoIdBlockProps) {
  const { modifier: m } = props;

  return (
    <details
      key={m.config.identifier}
      tabIndex={0}
      className="group open:ring ring-primary-focus collapse-arrow border border-primary bg-base-100 rounded-box max-w-sm"
    >
      <summary className="collapse-title flex items-center text-xl font-medium list-none group-open:after:rotate-[225deg] [&::-webkit-details-marker]:hidden">
        {m.config.identifier}
      </summary>
      <div className="p-4">
        {m.config.options.map(o => <PrestoInput key={o.identifier} modifierId={m.id} option={o} />)}
      </div>
    </details>
  );
}

interface PrestoInputProps<O extends ModifierConfig.Base.Option> {
  modifierId: Modifier.Id;
  option: O;
}

function PrestoInput<O extends ModifierConfig.Base.Option>(props: PrestoInputProps<O>) {
  const { option: o, modifierId } = props;
  const [updatePrestoId, { isLoading }] = useMutation(setModifierPrestoId);
  const itemRep = o.managementRepresentation._tag === "Presto" ? o.managementRepresentation.id : undefined;
  const [id, setId] = useState(itemRep);

  return (
    <div key={o.identifier} className="form-control max-w-xs">
      <label className="label">
        <span className="label-text">Presto ID</span>
        <span className="label-text-alt">{o.identifier}</span>
      </label>
      <div className="input-group">
        <input
          defaultValue={itemRep}
          onChange={e => setId(Number(e.currentTarget.value))}
          type="number"
          placeholder="1337"
          className="input input-primary input-bordered"
        />
        <button
          type="button"
          disabled={id == null || id === itemRep || isLoading}
          onClick={() =>
            toast.promise(updatePrestoId({ id: modifierId, choice: o.identifier, prestoId: id! }), {
              pending: `setting option ${o.identifier} to presto id ${id!}...`,
              success: "Success!",
              error: "oh no",
            })}
          className="btn btn-square btn-primary"
        >
          <CheckIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
