import { describe, expect, it } from "vitest";

import { sanitizeExternalDownloadUrl } from "./safe-external-url";

describe("sanitizeExternalDownloadUrl", () => {
  it("allows standard https URL by default", () => {
    expect(sanitizeExternalDownloadUrl("https://cdn.example.com/file.jpg")).toBe(
      "https://cdn.example.com/file.jpg"
    );
  });

  it("rejects non-https URLs", () => {
    expect(sanitizeExternalDownloadUrl("http://cdn.example.com/file.jpg")).toBeNull();
  });

  it("rejects localhost and private IPv4", () => {
    expect(sanitizeExternalDownloadUrl("https://localhost/file.jpg")).toBeNull();
    expect(sanitizeExternalDownloadUrl("https://127.0.0.1/file.jpg")).toBeNull();
    expect(sanitizeExternalDownloadUrl("https://10.0.0.5/file.jpg")).toBeNull();
    expect(sanitizeExternalDownloadUrl("https://192.168.1.10/file.jpg")).toBeNull();
    expect(sanitizeExternalDownloadUrl("https://169.254.169.254/latest/meta-data")).toBeNull();
  });

  it("rejects loopback and local IPv6", () => {
    expect(sanitizeExternalDownloadUrl("https://[::1]/file.jpg")).toBeNull();
    expect(sanitizeExternalDownloadUrl("https://[fd00::1]/file.jpg")).toBeNull();
    expect(sanitizeExternalDownloadUrl("https://[fe80::1]/file.jpg")).toBeNull();
  });

  it("enforces allowlist when provided", () => {
    const allow = "cdn.example.com,.trusted-cdn.net";
    expect(
      sanitizeExternalDownloadUrl("https://cdn.example.com/file.jpg", allow)
    ).toBe("https://cdn.example.com/file.jpg");
    expect(
      sanitizeExternalDownloadUrl("https://img.trusted-cdn.net/file.jpg", allow)
    ).toBe("https://img.trusted-cdn.net/file.jpg");
    expect(
      sanitizeExternalDownloadUrl("https://evil.example.org/file.jpg", allow)
    ).toBeNull();
  });
});
