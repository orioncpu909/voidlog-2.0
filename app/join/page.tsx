import type { Metadata } from "next";
import { JoinRedirect } from "./JoinRedirect";

// Where a Wellness Account's invite link points. Messages and social apps read this page's title
// for the link preview, so the friend sees "Start your Wellness journey today"; opening it goes
// straight on to the app's create-account screen (/?signup=1), keeping the referral code.
export const metadata: Metadata = {
  title: "Start your Wellness journey today",
  description: "Join ARTHA free: book classes, therapies and treatments at West LA and Studio City.",
  openGraph: {
    title: "Start your Wellness journey today",
    description: "Join ARTHA free: book classes, therapies and treatments at West LA and Studio City.",
    siteName: "ARTHA",
  },
};

export default function JoinPage() {
  return <JoinRedirect />;
}
