import { useSession } from "@blitzjs/auth";
import { useMutation } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import { Button, Container, LoadingOverlay, Paper, PasswordInput, Stepper, TextInput } from "@mantine/core";
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { nanoid } from "nanoid";
import Image from "next/image";
import { Suspense, useState } from "react";
import { FieldValues, SubmitHandler } from "react-hook-form";
import getImgixUploadUrl from "src/admin/mutations/getImgixUploadUrl";
import { useZodForm } from "src/core/hooks/useZodForm";
import createOrganization from "src/organizations/mutations/createOrganization";
import { CreateOrganizationSchema } from "src/organizations/validations";
import createUser from "src/users/mutations/createUser";
import { CreateClientSchema } from "src/users/validations";
import createVenue from "src/venues/mutations/createVenue";
import { CreateVenueSchema } from "src/venues/validations";
import { z } from "zod";

interface FormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
}

function CreateClientForm(props: FormProps<z.infer<typeof CreateClientSchema>>) {
  const { onSubmit } = props;
  console.log(useSession({ suspense: true }));
  const form = useZodForm({
    schema: CreateClientSchema,
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { handleSubmit, register } = form;

  return (
    <Paper
      className="w-[460px]"
      component="form"
      withBorder
      mx="auto"
      shadow="md"
      p={30}
      mt={30}
      radius="md"
      onSubmit={handleSubmit(onSubmit)}
    >
      <fieldset className="space-y-6" disabled={form.formState.isSubmitting}>
        <TextInput type="email" label="Email" {...register("email")} />
        <PasswordInput label="password" {...register("password")} />
      </fieldset>
      <Button type="submit" fullWidth mt="xl" loading={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating..." : "Create User"}
      </Button>
    </Paper>
  );
}

const NoUserId = CreateOrganizationSchema.omit({ userId: true });

function CreateOrganizationForm(props: FormProps<z.infer<typeof NoUserId>>) {
  const { onSubmit } = props;
  const form = useZodForm({
    schema: NoUserId,
    defaultValues: {
      name: "",
      identifier: "",
    },
  });
  const { handleSubmit, register } = form;

  return (
    <Paper
      className="w-[460px]"
      component="form"
      withBorder
      mx="auto"
      shadow="md"
      p={30}
      mt={30}
      radius="md"
      onSubmit={handleSubmit(onSubmit)}
    >
      <fieldset className="space-y-6" disabled={form.formState.isSubmitting}>
        <TextInput label="Name" {...register("name")} />
        <TextInput label="Identifier" {...register("identifier")} />
      </fieldset>
      <Button type="submit" fullWidth mt="xl" loading={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating..." : "Create Organization"}
      </Button>
    </Paper>
  );
}

function CreateVenueForm(props: FormProps<z.infer<typeof NoOrgInfo>>) {
  const { onSubmit } = props;
  const NoOrgInfo = CreateVenueSchema.omit({ organizationId: true, memberId: true }).extend({
    logo: z
      .instanceof(File)
      .transform((a) => a as FileWithPath)
      .optional(),
  });
  const form = useZodForm({
    schema: NoOrgInfo,
    defaultValues: {
      identifier: "",
      en: {
        name: "",
      },
      he: {
        name: "",
      },
    },
  });
  const { handleSubmit, register, watch, setValue } = form;

  const preview = pipe(
    watch("logo"),
    O.fromNullable,
    O.map(URL.createObjectURL),
    O.map((src) => (
      <Image
        unoptimized
        width={460}
        height={270}
        key={src}
        src={src}
        alt="logo"
        onLoad={() => URL.revokeObjectURL(src)}
      />
    )),
    O.getOrElse(() => null),
  );

  return (
    <Paper
      className="w-[460px]"
      component="form"
      withBorder
      mx="auto"
      shadow="md"
      p={30}
      mt={30}
      radius="md"
      onSubmit={handleSubmit(onSubmit)}
    >
      <fieldset className="space-y-6" disabled={form.formState.isSubmitting}>
        <TextInput label="Identifier" {...register("identifier")} />
        <TextInput label="English Name" {...register("en.name")} />
        <TextInput label="Hebrew Name" {...register("he.name")} />
        <Dropzone
          accept={IMAGE_MIME_TYPE}
          onDrop={([file]) => {
            if (file) setValue("logo", file);
          }}
        >
          <p className="text-center">Drop logo here</p>
        </Dropzone>
        {preview}
      </fieldset>
      <Button type="submit" fullWidth mt="xl" loading={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating..." : "Create Venue"}
      </Button>
    </Paper>
  );
}

function Forms() {
  const [active, setActive] = useState(0);

  const [createUserMutation, createUserBag] = useMutation(createUser, {
    onSuccess: () => setActive(1),
  });

  const [createOrgMutation, createOrgBag] = useMutation(createOrganization, {
    onSuccess: () => setActive(2),
  });

  const [getUrl] = useMutation(getImgixUploadUrl);

  const [createVenueMutation, createVenueBag] = useMutation(createVenue, {
    onSuccess: () => setActive(3),
  });

  return (
    <Stepper active={active} onStepClick={setActive}>
      <Stepper.Step
        label="Step 1"
        description="Create the admin of the organization"
        loading={createUserBag.isLoading}
        allowStepSelect={false}
      >
        <CreateClientForm onSubmit={(data) => createUserMutation(data)} />
      </Stepper.Step>
      <Stepper.Step
        label="Step 2"
        description="Create the organization"
        loading={createOrgBag.isLoading}
        // allowStepSelect={false}
      >
        <CreateOrganizationForm
          onSubmit={(data) => createOrgMutation({ ...data, userId: createUserBag.data!.id })}
        />
      </Stepper.Step>
      <Stepper.Step
        label="Step 3"
        description="Create the venue"
        loading={createVenueBag.isLoading}
        // allowStepSelect={false}
      >
        <CreateVenueForm
          onSubmit={async ({ logo, ...data }) => {
            if (logo) {
              const { url, headers: h } = await getUrl({
                name: `${logo.name}-${nanoid()}.${logo.name.split(".").pop()}`,
                venue: data.identifier,
              });
              const headers = new Headers(h);
              headers.append("Content-Length", `${logo.size + 5000}`);

              const {
                data: {
                  attributes: { origin_path },
                },
              } = await fetch(url, {
                method: "POST",
                headers,
                body: await logo.arrayBuffer(),
              }).then((res) => res.json());

              return createVenueMutation({
                ...data,
                logo: origin_path,
                memberId: createOrgBag.data!.memberships[0]!.id,
                organizationId: createOrgBag.data!.id,
              });
            }

            return createVenueMutation({
              ...data,
              memberId: createOrgBag.data!.memberships[0]!.id,
              organizationId: createOrgBag.data!.id,
            });
          }}
        />
      </Stepper.Step>
      <Stepper.Completed>Done! New client created</Stepper.Completed>
    </Stepper>
  );
}

export default function _AdminClientsNew() {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <Container pt={28}>
        <Forms />
      </Container>
    </Suspense>
  );
}
