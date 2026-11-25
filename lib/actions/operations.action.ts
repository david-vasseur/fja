"use server";

import { cookies } from "next/headers";
import { backendFetch, SESSION_COOKIE } from "@/lib/backend";
import { OperationData, Vente } from "@/types/operation";

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

export async function getOperationsAction(
  clientFp: string
): Promise<ActionResponse<OperationData[]>> {
  try {
    const data = await backendFetch<OperationData[]>("/operations", {
      method: "GET",
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function getOperationBySlugAction(
  slug: string,
  clientFp: string
): Promise<ActionResponse<OperationData>> {
  try {
    const data = await backendFetch<OperationData>(`/operations/${slug}`, {
      method: "GET",
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function createOperationAction(
  payload: Omit<OperationData, "id" | "ventes" | "vendeursEnPied"> & {
    vendeursEnPied?: string[];
  },
  clientFp: string
): Promise<ActionResponse<OperationData>> {
  try {
    const data = await backendFetch<OperationData>("/operations", {
      method: "POST",
      body: JSON.stringify(payload),
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function updateOperationAction(
  slug: string,
  payload: Partial<OperationData>,
  clientFp: string
): Promise<ActionResponse<OperationData>> {
  try {
    const data = await backendFetch<OperationData>(`/operations/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function deleteOperationAction(
  id: string,
  clientFp: string
): Promise<ActionResponse<{ ok: boolean }>> {
  try {
    const data = await backendFetch<{ ok: boolean }>(`/operations/${id}`, {
      method: "DELETE",
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

// ==========================================
// VENTES (CRUD)
// ==========================================

export async function addVenteAction(
  slug: string,
  payload: Omit<Vente, "id">,
  clientFp: string
): Promise<ActionResponse<Vente>> {
  try {
    const data = await backendFetch<Vente>(`/operations/${slug}/ventes`, {
      method: "POST",
      body: JSON.stringify(payload),
      clientFp,
    });
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function updateVenteAction(
  slug: string,
  venteId: string,
  payload: Partial<Vente>,
  clientFp: string
): Promise<ActionResponse<Vente>> {
  try {
    const data = await backendFetch<Vente>(
      `/operations/${slug}/ventes/${venteId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
        clientFp,
      }
    );
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}

export async function deleteVenteAction(
  slug: string,
  venteId: string,
  clientFp: string
): Promise<ActionResponse<{ ok: boolean }>> {
  try {
    const data = await backendFetch<{ ok: boolean }>(
      `/operations/${slug}/ventes/${venteId}`,
      {
        method: "DELETE",
        clientFp,
      }
    );
    return { success: true, data };
  } catch (err) {
    return handleApiError(err);
  }
}
