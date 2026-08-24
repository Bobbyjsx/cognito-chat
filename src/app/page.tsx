import { LandingPage } from "@/components/modules/landing/LandingPage";
import { auth } from "@/auth";
import {
  APP_DESCRIPTION,
  APP_TITLE,
  APP_URL,
  OG_IMAGE,
  OG_IMAGE_PNG,
  indexRobots,
} from "@/lib/site";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: {
    absolute: APP_TITLE,
  },
  description: APP_DESCRIPTION,
  alternates: {
    canonical: APP_URL,
  },
  robots: indexRobots,
  openGraph: {
    url: APP_URL,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE_PNG, OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default async function HomePage() {
  const session = await auth();
  if (session) {
    redirect("/chat");
  }

  return <LandingPage />;
}
