import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("admin", "routes/admin.tsx"),
  route("api/validate", "routes/api.validate.ts"),
] satisfies RouteConfig;
