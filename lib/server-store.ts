import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function readDataFile(name: string): Promise<unknown> {
  const raw = await fs.readFile(path.join(DATA_DIR, name), "utf8");
  return JSON.parse(raw);
}

export async function writeDataFile(name: string, value: unknown) {
  const body = JSON.stringify(value, null, 2) + "\n";
  // Local dev: write straight to the repo file.
  if (!process.env.VERCEL) {
    await fs.writeFile(path.join(DATA_DIR, name), body, "utf8");
    return { committed: false as const };
  }
  // Production (Vercel, read-only fs): commit to GitHub so the change is
  // permanent and triggers a redeploy.
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) {
    throw new Error(
      "GITHUB_TOKEN / GITHUB_REPO not configured — cannot persist on Vercel.",
    );
  }
  const apiBase = `https://api.github.com/repos/${repo}/contents/public/data/${name}`;
  const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  const existing = getRes.ok ? await getRes.json() : null;
  const sha: string | undefined = existing?.sha;
  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `admin: update ${name}`,
      content: Buffer.from(body, "utf8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) {
    const text = await putRes.text();
    if (putRes.status === 403) {
      throw new Error(
        `GitHub rejected the token (403). Fix: create a fine-grained personal access token scoped to "${repo}" with Contents: read + write, put it in GITHUB_TOKEN (Vercel → Environment Variables, all environments), then Redeploy. Details: ${text.slice(0, 200)}`,
      );
    }
    if (putRes.status === 404) {
      throw new Error(
        `GitHub repo/branch not found (404). Fix: check GITHUB_REPO ("${repo}") and GITHUB_BRANCH ("${branch}") in Vercel env vars, then Redeploy. Details: ${text.slice(0, 200)}`,
      );
    }
    throw new Error(`GitHub commit failed (${putRes.status}): ${text.slice(0, 300)}`);
  }
  const json = await putRes.json();
  return {
    committed: true as const,
    sha: json?.commit?.sha as string | undefined,
    url: json?.commit?.html_url as string | undefined,
  };
}

export function checkAdminPin(req: Request): boolean {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return false;
  const got =
    req.headers.get("x-admin-pin") ?? req.headers.get("x-admin-pin".toLowerCase());
  return got === expected;
}

export function adminPinConfigured() {
  return Boolean(process.env.ADMIN_PIN);
}
