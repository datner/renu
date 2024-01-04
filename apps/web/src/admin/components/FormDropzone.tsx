import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { Group, Text } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useTranslations } from "next-intl";
import Image from "next/image";
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

  return (
    <>
      <Dropzone
        onDrop={onDrop}
        maxFiles={1}
        accept={IMAGE_MIME_TYPE}
        maxSize={5 * 1024 ** 2}
      >
        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: "none" }}>
          <Dropzone.Accept>
            <ArrowUpTrayIcon
              className="size-12"
              style={{ color: "var(--mantine-color-blue-6)" }}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <XMarkIcon
              className="size-12"
              style={{ color: "var(--mantine-color-red-6)" }}
            />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <PhotoIcon
              className="size-12"
              style={{ color: "var(--mantine-color-dimmed)" }}
            />
          </Dropzone.Idle>

          <div>
            <Text size="sm" inline>
              {t("drag and drop here")}
            </Text>
            <Text size="xs" c="dimmed" inline mt={7}>
              File should not exceed 5mb
            </Text>
          </div>
        </Group>
      </Dropzone>

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
