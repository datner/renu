import { create, useModal } from "@ebay/nice-modal-react";
import { DefaultValues } from "react-hook-form";
import { category } from "src/categories/hooks/form";
import { CreateCategory } from "src/categories/validations";
import { useLocale } from "src/core/hooks/useLocale";
import { CategoryForm } from "./CategoryForm";
import { Modal, renuModal } from "./Modal";

type Props = {
  name: string;
};

export const CreateCategoryModal = create<Props>(({ name }) => {
  const modal = useModal();
  const locale = useLocale();
  const { onSubmit } = category.useCreate();
  const defaultValues = {
    [locale]: {
      name,
    },
  } satisfies DefaultValues<CreateCategory>;

  return (
    <Modal {...renuModal(modal)}>
      <CategoryForm
        onSubmit={async (form) => {
          const category = await onSubmit(form);
          modal.resolve(category);
          modal.hide();
        }}
        defaultValues={defaultValues}
      />
    </Modal>
  );
});
