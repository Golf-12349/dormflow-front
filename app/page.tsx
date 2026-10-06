import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

/**
 * Entry point: send signed-in staff to the dashboard, everyone else to login.
 * Both branches redirect, so this page never renders visible UI.
 */
export default async function Home() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}