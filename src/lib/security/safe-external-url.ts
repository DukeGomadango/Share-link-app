import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function isBlockedIpv4(host: string): boolean {
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function isBlockedIpv6(host: string): boolean {
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::" || normalized === "::1") return true;
  if (/^fe[89ab]/i.test(normalized)) {
    return true;
  }
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) {
      return isBlockedIpv4(mapped);
    }
  }
  return false;
}

function parseAllowlistEnv(allowlistCsv?: string): string[] {
  return (allowlistCsv ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function hostAllowedByAllowlist(hostname: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  return allowlist.some((entry) => {
    if (entry.startsWith(".")) {
      return hostname.endsWith(entry);
    }
    return hostname === entry;
  });
}

export function sanitizeExternalDownloadUrl(
  input: string,
  allowlistCsv?: string
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password) return null;
  if (parsed.port && parsed.port !== "443") return null;

  const hostname = parsed.hostname.toLowerCase();
  const normalizedHost = hostname.replace(/^\[|\]$/g, "");
  if (!hostname) return null;
  if (hostname.endsWith(".localhost")) return null;
  if (hostname.endsWith(".local")) return null;
  if (BLOCKED_HOSTNAMES.has(hostname)) return null;

  const ipVersion = isIP(normalizedHost);
  if (ipVersion === 4 && isBlockedIpv4(normalizedHost)) return null;
  if (ipVersion === 6 && isBlockedIpv6(normalizedHost)) return null;

  const allowlist = parseAllowlistEnv(allowlistCsv);
  if (!hostAllowedByAllowlist(hostname, allowlist)) return null;

  return parsed.toString();
}
