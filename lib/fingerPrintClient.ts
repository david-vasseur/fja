"use client";

export async function getClientFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    navigator.language,
    window.innerWidth,
    window.innerHeight,
    window.devicePixelRatio || 1,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || "",
  ].join("|");

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
