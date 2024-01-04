import { BlitzPage, Routes } from "@blitzjs/next";
import { useMutation } from "@blitzjs/rpc";
import { Anchor, Button, Container, Paper, PasswordInput, Text, TextInput, Title } from "@mantine/core";
import { AuthenticationError } from "blitz";
import Link from "next/link";
import { useRouter } from "next/router";
import login from "src/auth/mutations/login";
import { Login } from "src/auth/validations";
import { useZodForm } from "src/core/hooks/useZodForm";
import Layout from "src/core/layouts/Layout";

function LoginForm() {
  const router = useRouter();
  const [loginMutation] = useMutation(login);
  const form = useZodForm({
    schema: Login,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await loginMutation(data);
      router.push(Routes.AdminHome());
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        return form.setFormError("Sorry, those credentials are invalid");
      }

      if (error instanceof Error) {
        return form.setFormError(
          "Sorry, we had an unexpected error. Please try again. - " + error.toString(),
        );
      }

      return form.setFormError("Sorry, we had an unexpected error. Please try again.");
    }
  });

  return (
    <Paper
      component="form"
      withBorder
      shadow="md"
      p={30}
      mt={30}
      radius="md"
      onSubmit={handleSubmit}
    >
      <fieldset disabled={form.formState.isSubmitting}>
        <TextInput
          {...form.register("email", { required: true })}
          label="Email"
          placeholder="you@renu.menu"
        />
        <PasswordInput
          {...form.register("password", { required: true })}
          label="Password"
          placeholder="your password"
          mt="md"
        />
        <Link passHref href={Routes.ForgotPasswordPage()} legacyBehavior>
          <Anchor<"a"> size="sm">Forgot Password?</Anchor>
        </Link>
      </fieldset>
      <Button type="submit" fullWidth mt="xl" loading={form.formState.isSubmitting}>
        Sign In
      </Button>
    </Paper>
  );
}

const Authentication: BlitzPage = () => {
  return (
    <Container size={420} my={40}>
      <Title ta="center" fw="bolder">
        Welcome back!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Do you not have an account yet?{" "}
        <Link passHref href={Routes.UserSignupPage()} legacyBehavior>
          <Anchor<"a"> size="sm">Create Account</Anchor>
        </Link>
      </Text>

      <LoginForm />
    </Container>
  );
};

Authentication.redirectAuthenticatedTo = Routes.AdminHome();
Authentication.suppressFirstRenderFlicker = true;
Authentication.getLayout = (page) => <Layout title="Home">{page}</Layout>;

export default Authentication;
