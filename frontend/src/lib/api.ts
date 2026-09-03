export async function sendJson<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
