"use client";

import { useEffect } from "react";

/** Registers the home-screen service worker so Web Push can arrive when closed. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Private Safari / older iOS — push just stays unavailable.
    });
  }, []);

  return null;
}
