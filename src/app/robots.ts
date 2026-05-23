import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/use-cases", "/privacy-policy", "/terms"],
      disallow: [
        "/api/",
        "/auth/",
        "/dashboard",
        "/campaigns",
        "/library",
        "/settings",
        "/recipients",
        "/claim",
        "/receive",
        "/login",
        "/register",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
