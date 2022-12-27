import Image from "next/image"
import { useEvent } from "src/core/hooks/useEvent"
import { useDropzone } from "react-dropzone"
import { useTranslations } from "next-intl"
import { useController } from "react-hook-form"
import { z } from "zod"
import { ItemSchema } from "src/items/validations"

export function FormDropzone() {
  const t = useTranslations("admin.Components.FormDropzone")
  const { field, fieldState } = useController<z.input<typeof ItemSchema>, "image">({
    name: "image",
  })

  const onDrop = useEvent((acceptedFiles: File[]) => {
    const [file] = acceptedFiles
    if (!file) return
    field.onChange({ src: URL.createObjectURL(file), file })
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  })

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
        {field.value.src && (
          <Image
            className="object-cover"
            unoptimized={fieldState.isDirty}
            alt="preview"
            placeholder={!fieldState.isDirty && field.value.blur ? "blur" : "empty"}
            src={field.value.src}
            blurDataURL={field.value.blur}
            fill
            sizes="100vw"
          />
        )}
      </div>
    </>
  )
}
