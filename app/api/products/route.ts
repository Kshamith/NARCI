import { NextResponse } from "next/server";
import {
  checkAdminPin,
  adminPinConfigured,
  readDataFile,
  writeDataFile,
} from "@/lib/server-store";
import { sanitizeProductsData as sanitizeProducts } from "@/lib/validators";

export async function GET() {
  try {
    const data = await readDataFile("products.json");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not read products." }, { status: 500 });
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
  const clean = sanitizeProducts(body);
  if (!clean) {
    return NextResponse.json(
      { error: "No valid products. Each needs sku, slug and name." },
      { status: 400 },
    );
  }
  try {
    const result = await writeDataFile("products.json", clean);
    return NextResponse.json({ ok: true, products: clean, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed.";
    const status = message.includes("GITHUB_TOKEN") ? 500 : 502;
    // Return the validated payload so the admin UI can offer Copy/Download fallback.
    return NextResponse.json({ error: message, products: clean }, { status });
  }
}

// POST alias: some mobile networks/proxies block PUT, so the admin saves via POST.
export { PUT as POST };
