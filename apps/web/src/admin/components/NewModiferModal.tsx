import { create, useModal } from "@ebay/nice-modal-react";
import clsx from "clsx";
import { ComponentPropsWithoutRef } from "react";
import { Modal, renuModal } from "./Modal";

type ModifierEnum = "oneOf" | "extras";

export const NewModifierModal = create(() => {
  const modal = useModal();

  const handleModifierType = (_tag: ModifierEnum) => () => {
    console.log("resolving: ", { _tag });
    modal.resolve({ _tag });
    modal.hide();
  };

  return (
    <Modal {...renuModal(modal)}>
      <div className="p-5">
        <div>pick a modifier type</div>
        <div className="my-3 grid grid-cols-4 gap-4">
          <ModifierBox
            onClick={handleModifierType("oneOf")}
            className="border-pink-300 shadow-pink-300/50 bg-pink-50 text-pink-600"
          >
            One Of
          </ModifierBox>
          <ModifierBox
            onClick={handleModifierType("extras")}
            className="border-blue-300 shadow-blue-300/50 bg-blue-50 text-blue-600"
          >
            Extras
          </ModifierBox>
          <ModifierBox
            disabled
            className="border-green-300 shadow-green-300/50 bg-green-100 text-green-600 opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </ModifierBox>
          <ModifierBox
            disabled
            className="border-green-300 shadow-green-300/50 bg-green-100 text-green-600 opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </ModifierBox>
          <ModifierBox
            disabled
            className="border-green-300 shadow-green-300/50 bg-green-100 text-green-600 opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </ModifierBox>
          <ModifierBox
            disabled
            className="border-green-300 shadow-green-300/50 bg-green-100 text-green-600 opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </ModifierBox>
          <ModifierBox
            disabled
            className="border-green-300 shadow-green-300/50 bg-green-100 text-green-600 opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </ModifierBox>
          <ModifierBox
            disabled
            className="border-green-300 shadow-green-300/50 bg-green-100 text-green-600 opacity-50 cursor-not-allowed"
          >
            Coming Soon
          </ModifierBox>
        </div>
      </div>
    </Modal>
  );
});

const ModifierBox = ({ className, ...props }: ComponentPropsWithoutRef<"button">) => (
  <button
    type="button"
    {...props}
    className={clsx(
      className,
      "border-gray-400 rounded border shadow-md aspect-square text-xl font-bold text-center justify-center flex items-center hover:scale-105 hover:rotate-3 transition-all",
    )}
  />
);
