import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/register";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { TenantService } from "../core/domain/tenant/tenant.service";
import { CreateTenantSchema } from "../core/domain/tenant/tenant.schema";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Register | Orbit" }];
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: CreateTenantSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    await TenantService.create(submission.value);
    return redirect("/login"); // TODO: Redirect to dashboard or login
  } catch (error) {
    // Handle unique constraint violations (e.g., slug or email already exists)
    // For simplicity, we'll just return a generic error for now, but in a real app
    // we should check error codes.
    return submission.reply({
      formErrors: ["Something went wrong. Please try again."],
    });
  }
};

export default function Register() {
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(CreateTenantSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreateTenantSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form method="post" id={form.id} onSubmit={form.onSubmit} className="space-y-6">
          <div>
            <label htmlFor={fields.name.id} className="block text-sm font-medium leading-6 text-gray-900">
              Organization Name
            </label>
            <div className="mt-2">
              <input
                {...fields.name} // Conform handles name, id, required, etc.
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
              <div className="text-red-500 text-sm mt-1">{fields.name.errors}</div>
            </div>
          </div>

          <div>
            <label htmlFor={fields.slug.id} className="block text-sm font-medium leading-6 text-gray-900">
              Slug (URL Identifier)
            </label>
            <div className="mt-2">
              <input
                {...fields.slug}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
              />
              <div className="text-red-500 text-sm mt-1">{fields.slug.errors}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-base font-semibold leading-7 text-gray-900">Admin User</h3>

            <div className="mt-4">
              <label htmlFor={fields.user.getFieldset().name.id} className="block text-sm font-medium leading-6 text-gray-900">
                Full Name
              </label>
              <div className="mt-2">
                <input
                  {...fields.user.getFieldset().name}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                />
                <div className="text-red-500 text-sm mt-1">{fields.user.getFieldset().name.errors}</div>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor={fields.user.getFieldset().email.id} className="block text-sm font-medium leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  {...fields.user.getFieldset().email}
                  type="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                />
                <div className="text-red-500 text-sm mt-1">{fields.user.getFieldset().email.errors}</div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
