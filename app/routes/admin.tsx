import { Outlet } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "../core/auth/session.server";
import { OrbitLayout } from "../core/layouts/OrbitLayout";

export async function loader({ request }: Route.LoaderArgs) {
  return await requireAdmin(request);
}

export const handle = {
  breadcrumb: () => [
    { label: 'Dashboard', href: '/admin' }
  ]
};

export default function AdminLayout() {
  return (
    <OrbitLayout>
      <Outlet />
    </OrbitLayout>
  );
}
