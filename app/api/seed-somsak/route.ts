import { NextRequest, NextResponse } from "next/server";
import { seedSomsakAction } from "@/lib/actions/seed";

export async function GET(request: NextRequest) {
  const result = await seedSomsakAction();

  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (acceptsJson || request.nextUrl.searchParams.get("json") === "true") {
    return NextResponse.json(result);
  }

  // If visited via browser URL bar, redirect to /tenants
  const redirectUrl = new URL("/tenants", request.url);
  redirectUrl.searchParams.set("seeded", result.success ? "1" : "0");
  if (!result.success) {
    redirectUrl.searchParams.set("error", encodeURIComponent(result.message));
  }
  return NextResponse.redirect(redirectUrl);
}

export async function POST(_request: NextRequest) {
  const result = await seedSomsakAction();
  return NextResponse.json(result);
}

