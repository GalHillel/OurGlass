type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const t = now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= t) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return { ok: true };
  }

  existing.count += 1;
  if (existing.count <= limit) return { ok: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - t) / 1000));
  return { ok: false, retryAfterSeconds };
}

