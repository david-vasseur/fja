"use server";

import { cookies } from "next/headers";
import { backendFetch, SESSION_COOKIE } from "@/lib/backend";
import { Vendeur } from "@/types/operation";

export type VendeurApiItem = Vendeur & {
  hasNir?: boolean;
};

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; unauthorized: true; error: string }
  | { success: false; unauthorized?: false; error: string };

async function handleApiError(err: unknown): Promise<ActionResponse<never>> {
  const status = (err as { status?: number })?.status;
  const message =
    err instanceof Error
      ? err.message
      : "Erreur lors de la communication serveur.";

  if (status === 401 || status === 403) {
    (await cookies()).delete(SESSION_COOKIE);
    return {
      success: false,
      unauthorized: true,
      error: "Session expirée ou empreinte invalide.",
    };
  }

  return { success: false, error: message };
}

export async function getVendeursAction(
  clientFp: string
): Promise<ActionResponse<VendeurApiItem[]>> {
  try {
    const data = await backendFetch<VendeurApiItem[]>("/vendeurs", {
      method: "GET",
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function getVendeurContractDataAction(
  id: string,
  clientFp: string
): Promise<ActionResponse<Vendeur>> {
  try {
    const data = await backendFetch<Vendeur>(`/vendeurs/${id}/contrat-data`, {
      method: "GET",
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function createVendeurAction(
  payload: Omit<Vendeur, "id">,
  clientFp: string
): Promise<ActionResponse<VendeurApiItem>> {
  try {
    const data = await backendFetch<VendeurApiItem>("/vendeurs", {
      method: "POST",
      body: JSON.stringify(payload),
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function updateVendeurAction(
  id: string,
  payload: Partial<Omit<Vendeur, "id">>,
  clientFp: string
): Promise<ActionResponse<VendeurApiItem>> {
  try {
    const data = await backendFetch<VendeurApiItem>(`/vendeurs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function deleteVendeurAction(
  id: string,
  clientFp: string
): Promise<ActionResponse<{ ok: boolean }>> {
  try {
    const data = await backendFetch<{ ok: boolean }>(`/vendeurs/${id}`, {
      method: "DELETE",
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}
