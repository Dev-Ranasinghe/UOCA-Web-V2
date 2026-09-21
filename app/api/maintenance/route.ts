import { NextResponse } from "next/server";
import { getMaintenanceMode } from "@/lib/site-settings";

// The maintenance page asks this every few seconds so it can send visitors back the moment the site is up again.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ maintenance: await getMaintenanceMode() }, { headers: { "Cache-Control": "no-store" } });
}
