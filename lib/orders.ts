export type OrderLogLine = {
  sku: string;
  name: string;
  size?: string;
  qty: number;
  unitPrice: number;
};

export type OrderLogEntry = {
  at: string;
  lines: OrderLogLine[];
  coupon?: string;
  discount: number;
  subtotal: number;
  total: number;
};

export const ORDER_LOG_KEY = "narci-order-log-v1";

export function readOrderLog(): OrderLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDER_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendOrderLog(entry: OrderLogEntry) {
  if (typeof window === "undefined") return;
  try {
    const next = [entry, ...readOrderLog()].slice(0, 50);
    window.localStorage.setItem(ORDER_LOG_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — ordering via WhatsApp still works */
  }
}
