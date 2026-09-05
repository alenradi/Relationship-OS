"use client";

import { useEffect } from "react";

/** Registers the home-screen service worker so Web Push can arrive when closed. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Private Safari / older iOS — push just stays unavailable.
      });
    };

    // iOS only finishes registration reliably after load, especially from
    // the Home Screen shortcut.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
