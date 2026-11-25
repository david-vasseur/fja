'use client';

import { useEffect } from 'react';

async function computeBrowserFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || '',
  ].join('|');

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function FingerprintInit() {
  useEffect(() => {
    computeBrowserFingerprint().then((fp) => {
      document.cookie = `fja_fp=${fp}; path=/; SameSite=Lax; max-age=31536000`;
    });
  }, []);

  return null;
}
