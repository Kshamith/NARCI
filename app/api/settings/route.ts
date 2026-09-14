import { NextResponse } from "next/server";
import {
  checkAdminPin,
  adminPinConfigured,
  readDataFile,
  writeDataFile,
} from "@/lib/server-store";
import { sanitizeSettingsData as sanitizeSettings } from "@/lib/validators";

export async function GET() {
  try {
    const data = await readDataFile("settings.json");
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not read settings." }, { status: 500 });
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
  const clean = sanitizeSettings(body);
  if (!clean) {
    return NextResponse.json(
      { error: "Settings need a WhatsApp number and contact email." },
      { status: 400 },
    );
  }
  try {
    const result = await writeDataFile("settings.json", clean);
    return NextResponse.json({ ok: true, settings: clean, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed.";
    return NextResponse.json({ error: message, settings: clean }, { status: 500 });
  }
}
