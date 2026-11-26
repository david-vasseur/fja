"use client";

export async function getClientFingerprint(): Promise<string> {
  const isTouchDevice =
    typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

  // Sur mobile/tablette, screen.width/height reste insensible au zoom iOS et au clavier virtuel
  const dimensions = isTouchDevice
    ? [
        Math.min(window.screen.width, window.screen.height),
        Math.max(window.screen.width, window.screen.height),
      ]
    : [window.innerWidth, window.innerHeight];

  const raw = [
    navigator.userAgent,
    navigator.language,
    ...dimensions,
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
