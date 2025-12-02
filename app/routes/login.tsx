import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { prisma } from "../core/db/prisma.server";
import { verifyPassword } from "../core/auth/password.server";
import { createUserSession } from "../core/auth/session.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Login | Orbit" }];
};

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: LoginSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { email, password } = submission.value;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return submission.reply({
      formErrors: ["Invalid email or password"],
    });
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return submission.reply({
      formErrors: ["Invalid email or password"],
    });
  }

  return createUserSession(user.id, "/");
};

export default function Login() {
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(LoginSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: LoginSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Orbit Control Plane
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Restricted access for authorized personnel only.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form method="post" id={form.id} onSubmit={form.onSubmit} className="space-y-6">
          {form.errors && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {form.errors}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor={fields.email.id} className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id={fields.email.id}
                name={fields.email.name}
                defaultValue={fields.email.initialValue}
                type="email"
                autoComplete="email"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
              <div className="text-red-500 text-sm mt-1">{fields.email.errors}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={fields.password.id} className="block text-sm font-medium leading-6 text-gray-900">
                Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id={fields.password.id}
                name={fields.password.name}
                defaultValue={fields.password.initialValue}
                type="password"
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
              <div className="text-red-500 text-sm mt-1">{fields.password.errors}</div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isSubmitting ? "Authenticating..." : "Access Control Plane"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
