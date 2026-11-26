"use server";

import { cookies } from "next/headers";
import { backendFetch, SESSION_COOKIE } from "@/lib/backend";

export async function savePushSubscriptionAction(
  subscription: PushSubscriptionJSON,
  clientFp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await backendFetch("/push/subscribe", {
      method: "POST",
      body: JSON.stringify({ subscription }),
      clientFp,
    });
    return { success: true };
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403) {
      (await cookies()).delete(SESSION_COOKIE);
      return {
        success: false,
        error: "Session expirée ou empreinte invalide.",
      };
    }
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement push.",
    };
  }
}
