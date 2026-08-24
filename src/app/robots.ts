import { APP_URL } from "@/lib/site";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/chat", "/settings", "/library", "/oauth", "/login", "/api/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
