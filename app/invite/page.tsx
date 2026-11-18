import type { Metadata } from "next";
import { LOCATIONS } from "@/lib/data";
import { timeLabel } from "@/lib/format";
import { sessionStart } from "@/lib/schedule";
import { inviteHeadline, readInviteCode } from "@/lib/invite";
import { InviteRedirect } from "./InviteRedirect";

// Where a join-me invite link points (/invite?i=…). Messages and social apps show this page's
// title in the link preview: "You've been invited to Contrast, for $25". Opening it goes straight
// on to the app (/?invite=…), which shows the invite and asks the friend to confirm the charge.
type Props = { searchParams: { i?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const inv = searchParams.i ? readInviteCode(searchParams.i) : null;
  if (!inv) return { title: "You've been invited to ARTHA" };
  const title = inviteHeadline(inv);
  // A real date, not "Today": a link preview can be read days later.
  const day = sessionStart(inv.date, "12:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const description = `${inv.fromName} invited you: ${day} at ${timeLabel(inv.time)}, ARTHA ${LOCATIONS[inv.location].short}.`;
  return { title, description, openGraph: { title, description, siteName: "ARTHA" } };
}

export default function InvitePage({ searchParams }: Props) {
  return <InviteRedirect code={searchParams.i ?? ""} />;
}
