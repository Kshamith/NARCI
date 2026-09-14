import { NextResponse } from "next/server";
import {
  checkAdminPin,
  adminPinConfigured,
  readDataFile,
  writeDataFile,
} from "@/lib/server-store";
import { sanitizeCouponsData as sanitizeCoupons } from "@/lib/validators";

export async function GET() {
  try {
    const data = await readDataFile("coupons.json");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not read coupons." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!adminPinConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PIN is not set on the server. Set it in Vercel env vars." },
      { status: 500 },
    );
  }
  if (!checkAdminPin(req)) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const clean = sanitizeCoupons(body);
  if (!clean) {
    return NextResponse.json({ error: "No valid coupons." }, { status: 400 });
  }
  try {
    const result = await writeDataFile("coupons.json", clean);
    return NextResponse.json({ ok: true, coupons: clean, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed.";
    return NextResponse.json({ error: message, coupons: clean }, { status: 500 });
  }
}

// POST alias: some mobile networks/proxies block PUT, so the admin saves via POST.
export { PUT as POST };
