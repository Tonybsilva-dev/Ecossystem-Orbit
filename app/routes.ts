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
  ]),
  route("api/validate", "routes/api.validate.ts"),
  route("api/products/:slug", "routes/api.products.$slug.ts"),
  route("api/subscriptions", "routes/api.subscriptions.ts"),
] satisfies RouteConfig;
