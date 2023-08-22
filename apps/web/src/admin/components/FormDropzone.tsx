import { useTranslations } from "next-intl";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useController, useFormContext } from "react-hook-form";
import { useEvent } from "src/core/hooks/useEvent";
import { ItemFormSchema } from "../validations/item-form";

export function FormDropzone() {
  const t = useTranslations("admin.Components.FormDropzone");
  const { control } = useFormContext<ItemFormSchema>();
  const { field, fieldState } = useController({
    control,
    name: "imageFile",
  });

  const image = useController({
    control,
    name: "image",
  });

  const onDrop = useEvent((acceptedFiles: File[]) => {
    const [file] = acceptedFiles;
    if (!file) return;
    field.onChange(file);
    image.field.onChange({ src: URL.createObjectURL(file) });
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  return (
    <>
      <span className="block text-sm font-medium text-gray-700">{t("image")}</span>
      <div
        {...getRootProps()}
        className="p-2 mt-1 rounded-md cursor-pointer border border-gray-300 bg-gray-100 border-dashed"
      >
        <input {...getInputProps()} />
        <span className="text-gray-400 text-sm">
          {isDragActive ? <p>{t("drop files here")}</p> : <p>{t("drag and drop here")}</p>}
        </span>
      </div>

      <div className="mt-2 relative grow">
        {image.field.value?.src && (
          <Image
            className="object-cover"
            unoptimized={fieldState.isDirty}
            alt="preview"
            placeholder={!fieldState.isDirty && image.field.value.blur ? "blur" : "empty"}
            src={image.field.value.src}
            blurDataURL={image.field.value.blur}
            fill
            sizes="100vw"
          />
        )}
      </div>
    </>
  );
}
