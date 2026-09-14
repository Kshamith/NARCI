import { NextResponse } from "next/server";
import {
  checkAdminPin,
  readDataFile,
  writeDataFile,
} from "@/lib/server-store";
import type { OrderLogEntry } from "@/lib/orders";

/**
 * Shared order log (admin-visible across devices).
 * NOTE: checkout appends are best-effort — every POST here becomes a GitHub
 * commit + Vercel redeploy in production, so the bag keeps a local log as
 * primary and fires this in the background without blocking WhatsApp.
 */
function sanitizeLog(v: unknown): OrderLogEntry[] | null {
  if (!Array.isArray(v)) return null;
  const out: OrderLogEntry[] = [];
  for (const e of v) {
    if (typeof e !== "object" || e === null) continue;
    const r = e as Record<string, unknown>;
    if (typeof r.at !== "string" || !Array.isArray(r.lines)) continue;
    out.push({
      at: r.at,
      lines: (r.lines as OrderLogEntry["lines"]).filter(
        (l) => typeof l?.sku === "string" && typeof l?.qty === "number",
      ),
      coupon: typeof r.coupon === "string" ? r.coupon : undefined,
      discount: Number(r.discount) || 0,
      subtotal: Number(r.subtotal) || 0,
      total: Number(r.total) || 0,
    });
  }
  return out;
}

export async function GET() {
  try {
    const data = await readDataFile("orders.json");
    return NextResponse.json(sanitizeLog(data) ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

// Appends one entry. No PIN required (called by checkout), but rate-limited
// by keeping only the latest 100 entries.
// POST with { action: "clear" } clears the log instead (PIN required, since
// some mobile networks block DELETE).
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).action === "clear"
  ) {
    if (!checkAdminPin(req)) {
      return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
    }
    try {
      const result = await writeDataFile("orders.json", []);
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Clear failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
  const entry: unknown = body;
  const clean = sanitizeLog([entry]);
  if (!clean || clean.length === 0) {
    return NextResponse.json({ error: "Invalid order entry." }, { status: 400 });
  }
  try {
    const current = sanitizeLog(await readDataFile("orders.json")) ?? [];
    const next = [clean[0], ...current].slice(0, 100);
    await writeDataFile("orders.json", next);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Never block checkout on shared-log failures.
    const message = e instanceof Error ? e.message : "Log failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 202 });
  }
}

// Clearing the shared log is admin-only (PIN required).
export async function DELETE(req: Request) {
  if (!checkAdminPin(req)) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }
  try {
    const result = await writeDataFile("orders.json", []);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Clear failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
