"use client";

import { useEffect } from "react";

// Sends the invite on to the create-account screen, carrying the referral code.
export function JoinRedirect() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    window.location.replace(`/?signup=1${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`);
  }, []);
  return null;
}
