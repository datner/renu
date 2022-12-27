import { useRouter } from "next/router"
import { Routes } from "@blitzjs/next"
import { getQueryClient, useMutation, useQuery } from "@blitzjs/rpc"
import { useZodForm } from "src/core/hooks/useZodForm"
import { useController } from "react-hook-form"
import { z } from "zod"
import impersonateUser from "src/auth/mutations/impersonateUser"
import {
  Paper,
  Button,
  Input,
  Loader,
  Container,
  Autocomplete,
  SegmentedControl,
  LoadingOverlay,
  AutocompleteProps,
} from "@mantine/core"
import getOrgUsers from "src/users/queries/getOrgUsers"
import { Prisma } from "@prisma/client"
import * as S from "fp-ts/string"
import * as Eq from "fp-ts/Eq"
import * as O from "fp-ts/Option"
import * as NA from "fp-ts/NonEmptyArray"
import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/function"
import { forwardRef, ForwardRefExoticComponent, RefAttributes, Suspense, useMemo } from "react"

/*
 * This file is just for a pleasant getting started page for your new app.
 * You can delete everything in here and start from scratch if you like.
 */

const eqThing = Eq.struct({
  group: S.Eq,
  value: S.Eq,
})

const UserAutocomplete: ForwardRefExoticComponent<
  Omit<AutocompleteProps, "data"> &
    RefAttributes<HTMLInputElement> & { filter?: string; groupBy: "venue" | "organization" }
> = forwardRef(({ filter = "", groupBy, ...rest }, ref) => {
  const [{ users }] = useQuery(getOrgUsers, {
    orderBy: { id: Prisma.SortOrder.asc },
  })

  const data = useMemo(() => {
    return pipe(
      NA.fromArray(users),
      O.map((users) =>
        pipe(
          users,
          A.chain((u) =>
            pipe(
              u.membership,
              groupBy === "venue"
                ? A.chain((m) =>
                    pipe(
                      m.affiliations,
                      A.map((a) => a.Venue.identifier)
                    )
                  )
                : A.map((m) => m.organization.identifier),
              A.map((group) => ({ group, user: u }))
            )
          ),
          A.map((datum) => ({ ...datum, value: datum.user.email })),
          A.uniq(eqThing)
        )
      ),
      O.getOrElseW(() => [])
    )
  }, [groupBy, users])

  return (
    <Autocomplete
      label="Pick a User"
      ref={ref}
      {...rest}
      data={data}
      filter={(value, item) => item.value.includes(value) || item.group.includes(value)}
    />
  )
})
UserAutocomplete.displayName = "UserAutocomplete"

function ImpersonateUserForm() {
  const router = useRouter()
  const form = useZodForm({
    schema: z.object({ email: z.string(), groupBy: z.enum(["venue", "organization"]) }),
    defaultValues: {
      email: "",
      groupBy: "venue",
    },
  })
  const { handleSubmit, setFormError, control } = form

  const { field: groupBy } = useController({ control, name: "groupBy" })
  const { field: email } = useController({ control, name: "email" })

  const [impersonateUserMutation] = useMutation(impersonateUser)

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        await impersonateUserMutation(data)
        getQueryClient().clear()
        router.push(Routes.AdminHome())
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
          <Input.Wrapper label="Arrange Users By">
            <SegmentedControl
              fullWidth
              {...groupBy}
              data={[
                { label: "Venue", value: "venue" },
                { label: "Organization", value: "organization" },
              ]}
            />
          </Input.Wrapper>
          <Suspense
            fallback={
              <Autocomplete
                label="Loading users..."
                data={[]}
                rightSection={<Loader size={16} />}
              />
            }
          >
            <UserAutocomplete {...email} groupBy={groupBy.value} />
          </Suspense>
        </fieldset>
        <Button type="submit" fullWidth mt="xl" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Impersonating..." : "Sign In"}
        </Button>
      </Paper>
    </Container>
  )
}

export default function Impersonate() {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <ImpersonateUserForm />
    </Suspense>
  )
}
