import { useAuthenticatedSession } from "@blitzjs/auth";
import { invoke, useMutation, useQuery } from "@blitzjs/rpc";
import { ArrowUpTrayIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, CloseButton, Container, Group, Image, Paper, Text, TextInput } from "@mantine/core";
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Cause, Console, Effect, ReadonlyArray } from "effect";
import { useTranslations } from "next-intl";
import NextImage from "next/image";
import { Fragment, useState } from "react";
import { toast } from "react-toastify";
import updateAddress from "src/admin/mutations/updateAddress";
import { Settings } from "src/admin/validations/settings";
import { useZodForm } from "src/core/hooks/useZodForm";
import updateIconUrl from "src/venues/mutations/updateIconUrl";
import getVenueOpen from "src/venues/queries/getVenueOpen";
import getImgixUploadUrl from "../mutations/getImgixUploadUrl";

const uploadImage = (file: FileWithPath, venue: string, name: string) =>
  Effect.promise(() =>
    invoke(getImgixUploadUrl, {
      venue,
      name: `${name}.${file.name.split(".").pop()}`,
    })
  ).pipe(
    Effect.andThen(async (_) =>
      new Request(_.url, {
        method: "POST",
        headers: {
          ..._.headers,
          "Content-Length": `${file.size + 5000}`,
        },
        body: await file.arrayBuffer(),
      })
    ),
    Effect.andThen(fetch),
    Effect.andThen(_ => _.json()),
    Effect.map(_ => _.data.attributes.origin_path as string),
    Effect.andThen(path => invoke(updateIconUrl, { path })),
    Effect.tapErrorCause(_ => Console.error(Cause.pretty(_))),
    Effect.runPromise,
  );
export function VenueSettings() {
  const session = useAuthenticatedSession();
  const t = useTranslations("admin.Components.VenueSettings");
  const [files, setFiles] = useState<FileWithPath[]>([]);

  const form = useZodForm({
    schema: Settings,
  });

  const [updateSettings] = useMutation(updateAddress, {
    onSuccess() {
      fetch("/api/revalidate-current");
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateSettings(data);
  });

  return (
    <Container className="flex gap-4 pt-8" size="sm">
      <Paper
        className="p-8 w-96"
        component="form"
        shadow="md"
        radius="md"
        onSubmit={handleSubmit}
      >
        <fieldset disabled={form.formState.isSubmitting}>
          <TextInput {...form.register("address")} label={t("address")} />
          <TextInput {...form.register("phone")} label={t("phone number")} />
        </fieldset>
        <Button variant="filled" className="mt-4" type="submit" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("updating") : t("update")}
        </Button>
      </Paper>
      <Paper className="p-2 relative w-96" shadow="md" radius="md">
        {ReadonlyArray.match(files, {
          onEmpty: () => (
            <Dropzone
              onDrop={setFiles}
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
                    Drag image here or click to select file
                  </Text>
                  <Text size="xs" c="dimmed" inline mt={7}>
                    File should not exceed 5mb
                  </Text>
                </div>
              </Group>
            </Dropzone>
          ),
          onNonEmpty: ReadonlyArray.map((file, index) => {
            const imageUrl = URL.createObjectURL(file);
            return (
              <Fragment key="logo">
                <Image
                  component={NextImage}
                  width={100}
                  height={100}
                  alt="logo"
                  key={index}
                  src={imageUrl}
                  onLoad={() => URL.revokeObjectURL(imageUrl)}
                />
                <CloseButton onClick={() => setFiles([])} className="absolute top-4 right-4" size="lg" />
                <Button
                  onClick={() =>
                    toast.promise(uploadImage(file, session.venue.identifier, "logo"), {
                      pending: "Updating logo",
                      error: "Failed to update logo",
                      success: "Logo was updated",
                    })}
                  variant="filled"
                  className="mt-4"
                  type="submit"
                >
                  Change Icon
                </Button>
              </Fragment>
            );
          }),
        })}
      </Paper>
    </Container>
  );
}
