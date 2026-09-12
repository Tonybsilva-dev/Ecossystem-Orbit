import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("admin", "routes/admin.tsx", [
    index("routes/admin.dashboard.tsx"),
    route("products", "routes/admin.products._index.tsx"),
    route("products/:productId", "routes/admin.products.$productId.tsx"),
    route("tenants", "routes/admin.tenants.tsx"),
    route("subscriptions", "routes/admin.subscriptions.tsx"),
  ]),
] satisfies RouteConfig;
