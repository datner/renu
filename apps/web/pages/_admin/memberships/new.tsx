import { Routes } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useZodForm } from "src/core/hooks/useZodForm"
import { useController } from "react-hook-form"
import { z } from "zod"
import {
  Paper,
  Button,
  Loader,
  Container,
  Autocomplete,
  AutocompleteProps,
  TextInput,
  Alert,
  Code,
} from "@mantine/core"
import { Prisma } from "@prisma/client"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/function"
import { forwardRef, Suspense, useDeferredValue } from "react"
import getOrganizations from "src/organizations/queries/getOrganizations"
import getVenues from "src/venues/queries/getVenues"
import _inviteMember from "src/memberships/mutations/_inviteMember"
import { CheckCircleIcon } from "@heroicons/react/24/solid"

type AutocompleteComponent<P> = Omit<AutocompleteProps, "data"> & P

const VenueAutocomplete = forwardRef<HTMLInputElement, AutocompleteComponent<{ org?: string }>>(
  ({ org, ...rest }, ref) => {
    const [venueQuery] = useQuery(
      getVenues,
      {
        orderBy: { identifier: Prisma.SortOrder.asc },
        where: { organization: { identifier: org } },
      },
      { enabled: Boolean(org) }
    )

    return pipe(
      O.fromNullable(venueQuery),
      O.map((o) => o.venues),
      O.map(A.map((v) => v.identifier)),
      O.map((data) => (
        <Autocomplete key="venues" label="Pick Venue" ref={ref} {...rest} data={data} />
      )),
      O.getOrElse(() => (
        <Autocomplete
          key="venues"
          ref={ref}
          {...rest}
          disabled
          label="Pick Venue"
          placeholder="no org selected"
          data={[]}
        />
      ))
    )
  }
)
VenueAutocomplete.displayName = "UserAutocomplete"

const OrganizationAutocomplete = forwardRef<HTMLInputElement, AutocompleteComponent<{}>>(
  (props, ref) => {
    const [{ organizations }] = useQuery(getOrganizations, {
      orderBy: { id: Prisma.SortOrder.asc },
    })

    return (
      <Autocomplete
        key="venues"
        label="Pick an organizations"
        ref={ref}
        {...props}
        data={id(organizations)}
      />
    )
  }
)
OrganizationAutocomplete.displayName = "OrganizationAutocomplete"

const id = A.map<{ identifier: string }, string>((o) => o.identifier)

function InviteMemberForm() {
  const [invite, { data, isSuccess }] = useMutation(_inviteMember)
  const form = useZodForm({
    schema: z.object({
      organization: z.string(),
      name: z.string(),
      email: z.string().email(),
      venue: z.string().optional(),
    }),
  })
  const { handleSubmit, setFormError, control, register } = form

  const { field: org } = useController({ control, name: "organization" })
  const { field: venue } = useController({ control, name: "venue" })
  const deferredOrg = useDeferredValue(org.value)

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        await invite(data)
      } catch (error: any) {
        setFormError("Sorry, we had an unexpected error. Please try again. - " + error.toString())
      }
    },
    (err) => console.log(err)
  )

  return (
    <Container size="xs">
      <Paper
        sx={{ width: 460 }}
        component="form"
        withBorder
        shadow="md"
        p={30}
        mt={30}
        radius="md"
        onSubmit={onSubmit}
      >
        <fieldset className="space-y-6" disabled={form.formState.isSubmitting}>
          <div className="flex gap-4 [&>*]:flex-1">
            <Suspense
              fallback={
                <Autocomplete
                  label="Loading organizations..."
                  data={[]}
                  rightSection={<Loader size={16} />}
                />
              }
            >
              <OrganizationAutocomplete {...org} />
            </Suspense>
            <Suspense
              fallback={
                <Autocomplete
                  label="Loading venues..."
                  data={[]}
                  rightSection={<Loader size={16} />}
                />
              }
            >
              <VenueAutocomplete {...venue} org={deferredOrg} />
            </Suspense>
          </div>
          <TextInput label="Invitee Name" {...register("name")} />
          <TextInput type="email" label="Invitee email" {...register("email")} />
        </fieldset>
        {isSuccess ? (
          <Alert
            mt={24}
            icon={<CheckCircleIcon />}
            title="Success!"
            color="green"
            radius="xs"
            variant="outline"
          >
            {data ? (
              <div>
                Please send {data.sentTo} the following link to finish signup!
                <br />
                <Code color="blue">
                  {new URL(
                    Routes.ResetPasswordPage().pathname + `?token=${data.hashedToken}`,
                    "https://renu.menu"
                  ).toString()}
                </Code>
              </div>
            ) : (
              <p>User successfully added!</p>
            )}
          </Alert>
        ) : (
          <Button type="submit" fullWidth mt="xl" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating membership..." : "Get invite link"}
          </Button>
        )}
      </Paper>
    </Container>
  )
}

export default function _AdminMembershipsNew() {
  return (
    <Container pt={28}>
      <InviteMemberForm />
    </Container>
  )
}
