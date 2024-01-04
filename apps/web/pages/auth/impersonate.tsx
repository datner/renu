import { BlitzPage, Routes } from "@blitzjs/next";
import { getQueryClient, useMutation, useQuery } from "@blitzjs/rpc";
import {
  Autocomplete,
  AutocompleteProps,
  Button,
  ComboboxItem,
  Container,
  Input,
  Loader,
  LoadingOverlay,
  Paper,
  SegmentedControl,
} from "@mantine/core";
import { Prisma } from "database";
import { pipe, ReadonlyArray as A, ReadonlyRecord } from "effect";
import { useRouter } from "next/router";
import { forwardRef, ForwardRefExoticComponent, RefAttributes, Suspense, useMemo } from "react";
import { useController } from "react-hook-form";
import impersonateUser from "src/auth/mutations/impersonateUser";
import { useZodForm } from "src/core/hooks/useZodForm";
import getOrgUsers from "src/users/queries/getOrgUsers";
import { z } from "zod";

/*
 * This file is just for a pleasant getting started page for your new app.
 * You can delete everything in here and start from scratch if you like.
 */

const UserAutocomplete: ForwardRefExoticComponent<
  & Omit<AutocompleteProps, "data">
  & RefAttributes<HTMLInputElement>
  & { filter?: string; groupBy: "venue" | "organization" }
> = forwardRef(({ filter = "", groupBy, ...rest }, ref) => {
  const [{ users }] = useQuery(getOrgUsers, {
    orderBy: { id: Prisma.SortOrder.asc },
  });

  const data = useMemo(() => {
    if (groupBy === "venue" && false) {
      return pipe(
        A.flatMap(
          users,
          user =>
            A.flatMap(
              user.membership,
              m =>
                m.affiliations.map(_ => ({
                  user,
                  label: user.email,
                  value: user.email,
                  venue: _.Venue.identifier,
                })),
            ),
        ),
        A.groupBy(_ => _.venue),
        ReadonlyRecord.toEntries,
        A.map(([group, u]) => ({ group, items: u })),
      );
    }

    return pipe(
      A.flatMap(
        users,
        user =>
          A.map(
            user.membership,
            m => ({
              user,
              label: user.email,
              value: user.email,
              organization: m.organization.identifier,
            }),
          ),
      ),
      A.groupBy(_ => _.organization),
      ReadonlyRecord.toEntries,
      A.map(([group, u]) => ({ group, items: u })),
    );
  }, [groupBy, users]);

  return (
    <Autocomplete
      label="Pick a User"
      data-lpignore="true"
      data-form-type="other"
      ref={ref}
      {...rest}
      data={data}
      filter={({ options, search }) =>
        options.filter((option) => {
          console.log(option);
          return "group" in option
            ? ({
              ...option,
              items: option.items.filter(it =>
                it.label.toLowerCase().trim().includes(search.toLowerCase().trim())
                || (it as any).organization.toLowerCase().trim().includes(search.toLowerCase().trim())
              ),
            })
            : false;
        })}
    />
  );
});
UserAutocomplete.displayName = "UserAutocomplete";

function ImpersonateUserForm() {
  const router = useRouter();
  const form = useZodForm({
    schema: z.object({ email: z.string(), groupBy: z.enum(["venue", "organization"]) }),
    defaultValues: {
      email: "",
      groupBy: "venue",
    },
  });
  const { handleSubmit, setFormError, control } = form;

  const { field: groupBy } = useController({ control, name: "groupBy" });
  const { field: email } = useController({ control, name: "email" });

  const [impersonateUserMutation] = useMutation(impersonateUser);

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        await impersonateUserMutation(data);
        getQueryClient().clear();
        router.push(Routes.AdminHome());
      } catch (error: any) {
        setFormError("Sorry, we had an unexpected error. Please try again. - " + error.toString());
      }
    },
    (err) => console.log(err),
  );

  return (
    <Container size="xs">
      <Paper
        w={460}
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
              onChange={_ => groupBy.onChange(_ as "venue" | "organization")}
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
  );
}

const Impersonate: BlitzPage = () => {
  return (
    <Suspense fallback={<LoadingOverlay visible />}>
      <ImpersonateUserForm />
    </Suspense>
  );
};
Impersonate.authenticate = {};
Impersonate.suppressFirstRenderFlicker = true;

export default Impersonate;
