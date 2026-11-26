"use server";

import { cookies } from "next/headers";

export async function savePushSubscriptionAction(
  subscription: PushSubscriptionJSON,
  fingerprint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("fja_session")?.value; // Adapte au nom exact de ton cookie de session

    const res = await fetch(`${process.env.BACKEND_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY!,
        "x-fingerprint": fingerprint,
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ subscription }),
    });

    if (!res.ok) {
      return { success: false, error: "Erreur lors de l'enregistrement push" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Impossible de joindre le serveur" };
  }
}
