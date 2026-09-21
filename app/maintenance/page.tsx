import type { Metadata } from "next";
import MaintenanceView from "@/components/MaintenanceView";

export const metadata: Metadata = {
  title: "We'll be right back | UOCA",
  description: "The UOCA website is under maintenance. Please wait, we'll be back shortly.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <>
      {/* Without scripts nothing polls, so ask the browser to look again every minute. */}
      <noscript>
        <meta httpEquiv="refresh" content="60;url=/" />
      </noscript>
      <MaintenanceView />
    </>
  );
}
