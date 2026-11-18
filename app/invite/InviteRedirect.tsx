"use client";

import { useEffect } from "react";

// Sends the invite on to the app, which picks it up from ?invite=.
export function InviteRedirect({ code }: { code: string }) {
  useEffect(() => {
    window.location.replace(code ? `/?invite=${encodeURIComponent(code)}` : "/");
  }, [code]);
  return null;
}
