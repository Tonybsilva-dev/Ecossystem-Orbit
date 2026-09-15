import { useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { z } from "zod";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { orbitApi, OrbitApiError } from "../core/orbit-api/orbit-api.server";
import { createUserSession } from "../core/auth/session.server";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Login | Orbit Control Plane" }];
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

  try {
    const user = await orbitApi.post<{ userId: string }>("/auth/login", { email, password });
    return createUserSession(user.userId, "/admin");
  } catch (error) {
    if (error instanceof OrbitApiError && error.status === 401) {
      return submission.reply({
        formErrors: ["Invalid email or password"],
      });
    }
    throw error;
  }
};

export default function Login() {
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-void relative overflow-hidden font-sans selection:bg-quantum selection:text-void">
      {/* Topography backdrop */}
      <div
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: "url(/assets/images/coolbackgrounds-topography-fog.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>

      {/* Gravitational core glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-quantum/10 rounded-full blur-[110px] pointer-events-none"></div>

      {/* Orbit rings with a satellite traveling around each path */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-panel/40 pointer-events-none">
        <div className="absolute inset-0 rounded-full animate-[spin_50s_linear_infinite]">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-text-secondary/80 shadow-[0_0_6px_rgba(238,240,242,0.5)]"></span>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-quantum/20 pointer-events-none">
        <div className="absolute inset-0 rounded-full animate-[spin_28s_linear_infinite_reverse]">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-quantum shadow-[0_0_10px_rgba(238,240,242,0.7)]"></span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm relative z-10">
        <div className="bg-orbital border border-panel rounded-dock p-10 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="text-center mb-10">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-quantum mb-4 shadow-[0_0_15px_rgba(238,240,242,0.35)] hover:bg-quantum-hover transition-colors"
              aria-label="Back to Orbit home"
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_white]"></div>
            </Link>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
              Control Plane
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Sign in to manage products, tenants, and plans.
            </p>
          </div>

          <Form method="post" id={form.id} onSubmit={form.onSubmit} className="space-y-6">
            {form.errors && (
              <div role="alert" className="flex items-start gap-2.5 rounded-card bg-error/10 backdrop-blur-sm p-4 border border-error/20">
                <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                <p className="text-xs text-error leading-relaxed">{form.errors}</p>
              </div>
            )}

            <div>
              <label htmlFor={fields.email.id} className="block text-xs font-medium text-text-dim ml-1 mb-1.5">
                Email
              </label>
              <div className="mt-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-text-dim group-focus-within:text-quantum transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id={fields.email.id}
                  name={fields.email.name}
                  defaultValue={fields.email.initialValue}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  placeholder="admin@orbit.com"
                  className="block w-full rounded-btn border border-panel bg-void/50 py-3 pl-10 pr-4 text-text-primary shadow-sm placeholder:text-text-dim/50 focus:ring-1 focus:ring-quantum focus:border-quantum sm:text-sm transition-all disabled:opacity-50"
                />
              </div>
              <div className="text-error text-xs mt-1 ml-1">{fields.email.errors}</div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor={fields.password.id} className="block text-xs font-medium text-text-dim ml-1 mb-1.5">
                  Password
                </label>
              </div>
              <div className="mt-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-text-dim group-focus-within:text-quantum transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id={fields.password.id}
                  name={fields.password.name}
                  defaultValue={fields.password.initialValue}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="block w-full rounded-btn border border-panel bg-void/50 py-3 pl-10 pr-10 text-text-primary shadow-sm placeholder:text-text-dim/50 focus:ring-1 focus:ring-quantum focus:border-quantum sm:text-sm transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-dim hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-error text-xs mt-1 ml-1">{fields.password.errors}</div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-btn bg-quantum px-3 py-3.5 text-sm font-semibold leading-6 text-void shadow-[0_0_15px_rgba(238,240,242,0.2)] hover:shadow-[0_0_20px_rgba(238,240,242,0.35)] hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quantum disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none tracking-wide"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </Form>
        </div>

        <p className="mt-8 text-center text-xs text-text-dim">
          &copy; {new Date().getFullYear()} Antonio Silva. All rights reserved.
        </p>
      </div>
    </div>
  );
}
