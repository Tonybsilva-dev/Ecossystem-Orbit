import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { logout } from "../core/auth/session.server";

export const action = async ({ request }: Route.ActionArgs) => {
  return logout(request);
};

export const loader = async () => {
  return redirect("/");
};
