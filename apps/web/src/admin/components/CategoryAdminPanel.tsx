import { useMutation, useQuery } from "@blitzjs/rpc";
import { toast } from "react-toastify";
import _removeCategory from "src/categories/mutations/admin/_removeCategory";
import getCategory from "src/categories/queries/getCategory";
import * as _Menu from "src/menu/schema";

interface Props {
  readonly identifier: string;
}

export function CategoryAdminPanel(props: Props) {
  const { identifier } = props;
  const [category] = useQuery(getCategory, { identifier });
  const [removeCategory] = useMutation(_removeCategory);

  return (
    <div className="rounded-box bg-white border border-gray-400 p-4 flex justify-between">
      <button
        onClick={() =>
          toast.promise(removeCategory(_Menu.CategoryId(category.id)), {
            success: `Successfully deleted ${category.identifier}, bye bye`,
            pending: `Deleting category ${category.identifier}`,
            error: `Failed to delete category ${category.identifier}`,
          })}
        className="btn btn-error"
      >
        remove
      </button>
      <button className="btn btn-primary">rename</button>
      <button className="btn btn-secondary">change identifier</button>
    </div>
  );
}
