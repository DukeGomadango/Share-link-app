/**
 * だんごツール等ブラウザからの fetch 用 CORS。
 * `EXTERNAL_CORS_ORIGINS` にカンマ区切りで許可 Origin を列挙（例: http://localhost:3000）。
 */
const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
];

export function parseAllowedCorsOrigins(): string[] {
  const raw = process.env.EXTERNAL_CORS_ORIGINS;
  if (!raw?.trim()) {
    return DEFAULT_ORIGINS;
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsOriginForRequest(request: Request): string | null {
  const origin = request.headers.get("Origin");
  const allowed = parseAllowedCorsOrigins();
  if (!origin) {
    return allowed[0] ?? null;
  }
  return allowed.includes(origin) ? origin : null;
}

export function applyCorsHeaders(request: Request, headers: Headers): void {
  const acao = corsOriginForRequest(request);
  if (acao) {
    headers.set("Access-Control-Allow-Origin", acao);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Idempotency-Key"
  );
}

export function handleCorsPreflight(request: Request): Response {
  const headers = new Headers();
  applyCorsHeaders(request, headers);
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}

export function jsonWithCors(
  data: unknown,
  request: Request,
  init?: ResponseInit & { status?: number }
): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  applyCorsHeaders(request, headers);
  const status = init?.status ?? 200;
  return new Response(JSON.stringify(data), { ...init, status, headers });
}
