import { createCookieSessionStorage, redirect } from "react-router";

// TODO: Move secret to env variable
const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-me";

export const storage = createCookieSessionStorage({
  cookie: {
    name: "orbit_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}

export async function requireAdmin(request: Request) {
  const userId = await requireUserId(request);

  const { orbitApi } = await import("../orbit-api/orbit-api.server");
  const user = await orbitApi.get<{ role: string }>(`/auth/users/${userId}`).catch(() => null);

  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    throw redirect("/"); // Redirect to home/dashboard if not admin
  }

  return userId;
}
