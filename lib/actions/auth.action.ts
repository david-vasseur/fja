"use server";

import { cookies } from "next/headers";
import { backendFetch, SESSION_COOKIE } from "@/lib/backend";

export type LoginResult =
  | { success: true; role: "admin"; identifiant: string }
  | { success: true; role: "operation"; identifiant: string; operationSlug: string }
  | { success: false; error: string };

export async function loginAction(
  identifiant: string,
  password: string,
  clientFp: string
): Promise<LoginResult> {
  const cleanId = identifiant.trim();
  const isEmail = cleanId.includes("@");

  try {
    if (isEmail) {
      const data = await backendFetch<{
        token: string;
        user: { role: "admin"; email: string; nom: string };
      }>("/auth/login-admin", {
        method: "POST",
        body: JSON.stringify({ email: cleanId.toLowerCase(), password }),
        clientFp,
        skipSession: true,
      });

      (await cookies()).set(SESSION_COOKIE, data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });

      return { success: true, role: "admin", identifiant: data.user.email };
    }

    const data = await backendFetch<{
      token: string;
      user: { role: "operation"; operationSlug: string; nomOperation: string };
    }>("/auth/login-operation", {
      method: "POST",
      body: JSON.stringify({ loginId: cleanId, loginPassword: password }),
      clientFp,
      skipSession: true,
    });

    (await cookies()).set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return {
      success: true,
      role: "operation",
      identifiant: cleanId,
      operationSlug: data.user.operationSlug,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Identifiant ou mot de passe incorrect.",
    };
  }
}

export async function verifySessionAction(clientFp: string) {
  try {
    return await backendFetch<{
      role: "admin" | "operation";
      operationSlug: string | null;
    }>("/auth/me", {
      method: "GET",
      clientFp,
    });
  } catch {
    return null;
  }
}

export async function logoutAction(clientFp: string) {
  await backendFetch("/auth/logout", {
    method: "POST",
    clientFp,
  }).catch(() => null);
  (await cookies()).delete(SESSION_COOKIE);
}
