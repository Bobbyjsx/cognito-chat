import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_TITLE,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    id: "/",
    scope: "/",
    start_url: "/chat",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["productivity", "utilities", "developer"],
    icons: [
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "New Chat",
        short_name: "Chat",
        description: "Start a new AI conversation",
        url: "/chat",
        icons: [
          {
            src: "/favicon/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
        ],
      },
      {
        name: "Library",
        short_name: "Library",
        description: "Browse prompt templates and history",
        url: "/library",
        icons: [
          {
            src: "/favicon/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
        ],
      },
      {
        name: "Settings",
        short_name: "Settings",
        description: "Manage account and token quota",
        url: "/settings",
        icons: [
          {
            src: "/favicon/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
