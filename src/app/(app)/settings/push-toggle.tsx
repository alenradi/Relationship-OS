"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { copy } from "@/lib/copy";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function standalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

type PushStatus =
  | "loading"
  | "unsupported"
  | "need-install"
  | "missing-key"
  | "off"
  | "on"
  | "denied";

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [key, setKey] = useState(vapidPublicKey);
  const [status, setStatus] = useState<PushStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      let nextKey = key;
      if (!nextKey) {
        try {
          const res = await fetch("/api/push/vapid");
          const data = (await res.json()) as { key?: string };
          nextKey = data.key ?? "";
          if (!cancelled) setKey(nextKey);
        } catch {
          nextKey = "";
        }
      }

      if (isIosDevice() && !standalone()) {
        if (!cancelled) setStatus("need-install");
        return;
      }

      if (!nextKey) {
        if (!cancelled) setStatus("missing-key");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) {
          setStatus(isIosDevice() ? "need-install" : "unsupported");
        }
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (Notification.permission === "denied") setStatus("denied");
        else setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [key]);

  function enable() {
    setError(null);
    start(async () => {
      if (!key) {
        setStatus("missing-key");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        setError(copy.push.enableFailed);
        return;
      }
      setStatus("on");
    });
  }

  function disable() {
    setError(null);
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    });
  }

  return (
    <div className="space-y-3">
      {status === "loading" ? (
        <p className="text-sm text-ink-faint">{copy.app.loading}</p>
      ) : null}
      {status === "unsupported" ? (
        <p className="text-sm text-ink-soft">{copy.push.unsupported}</p>
      ) : null}
      {status === "missing-key" ? (
        <p className="text-sm text-ink-soft">{copy.push.missingKey}</p>
      ) : null}
      {status === "need-install" ? (
        <p className="text-sm text-ink-soft">{copy.push.needInstall}</p>
      ) : null}
      {status === "denied" ? (
        <p className="text-sm text-ink-soft">{copy.push.denied}</p>
      ) : null}
      {status === "off" ? (
        <Button onClick={enable} disabled={pending}>
          {copy.push.enable}
        </Button>
      ) : null}
      {status === "on" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-sage-ink">{copy.push.enabled}</p>
          <Button variant="secondary" size="sm" onClick={disable} disabled={pending}>
            {copy.push.disable}
          </Button>
        </div>
      ) : null}
      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}
    </div>
  );
}
