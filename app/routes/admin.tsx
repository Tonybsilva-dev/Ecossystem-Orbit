import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "../core/auth/session.server";

export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireAdmin(request);
  return null;
};

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  );
}
