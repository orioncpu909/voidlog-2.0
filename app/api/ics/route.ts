import { NextRequest } from "next/server";
import { eventIcs } from "@/lib/icsFormat";

// Serves one booking as a calendar file that opens in place (text/calendar, inline). On iPhone,
// Safari shows its "Add to Calendar" screen for it, where a downloaded file would only go to Files.
// The booking's details come in the address (lib/ics.ts addToPhoneCalendar); nothing is stored.
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const field = (k: string, max = 300) => (q.get(k) ?? "").slice(0, max);
  const stamp = /^\d{8}T\d{6}$/;
  const start = field("start", 15);
  const end = field("end", 15);
  if (!stamp.test(start) || !stamp.test(end)) return new Response("Bad request", { status: 400 });
  const body = eventIcs({ uid: field("uid", 40).replace(/[^A-Za-z0-9-]/g, "") || "booking", title: field("title"), start, end, location: field("location"), note: field("note", 600) });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="artha-${start.slice(0, 8)}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
