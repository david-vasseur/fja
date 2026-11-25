import "server-only";
import { cookies, headers } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4002";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

export const SESSION_COOKIE = "fja_session";

export async function backendFetch<T>(
  path: string,
  options: RequestInit & { clientFp: string; skipSession?: boolean }
): Promise<T> {
  const cookieStore = await cookies();
  const headerList = await headers();

  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value || "";
  const userAgent = headerList.get("user-agent") || "";
  const forwardedFor = headerList.get("x-forwarded-for") || "";

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-internal-api-key": INTERNAL_API_KEY,
    "x-client-fingerprint": options.clientFp,
    "x-forwarded-user-agent": userAgent,
    ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipSession && sessionToken) {
    reqHeaders["x-session-token"] = sessionToken;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: reqHeaders,
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `Erreur backend (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}
