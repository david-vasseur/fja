"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { getClientFingerprint } from "@/lib/fingerPrintClient";
import { savePushSubscriptionAction } from "@/lib/actions/push.action";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnablePush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert(
        "Sur iPhone, ajoute d'abord l'application sur ton écran d'accueil (Partager → Sur l'écran d'accueil) puis réessaie."
      );
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Permission de notification refusée.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const fp = await getClientFingerprint();
      const res = await savePushSubscriptionAction(subscription.toJSON(), fp);
      if (res.success) {
        setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnablePush}
      disabled={loading || subscribed}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 border border-slate-700 text-xs text-amber-300 transition cursor-pointer disabled:opacity-60"
    >
      {subscribed ? (
        <>
          <BellRing className="w-3.5 h-3.5 text-emerald-400" />
          <span>Alertes actives</span>
        </>
      ) : (
        <>
          <Bell className="w-3.5 h-3.5" />
          <span>{loading ? "Activation..." : "Activer les alertes"}</span>
        </>
      )}
    </button>
  );
}
