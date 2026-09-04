import type { Metadata } from "next";
import { PublicChatView } from "@/components/modules/chat/PublicChatView";

interface PageProps {
  params: Promise<{
    shareId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  return {
    title: "Shared Conversation - Cognito",
    description: `View shared conversation ${shareId} on Cognito`,
    openGraph: {
      title: "Shared Conversation - Cognito",
      description: `View shared conversation ${shareId} on Cognito`,
      type: "website",
    },
  };
}

export default async function SharedChatPage({ params }: PageProps) {
  const { shareId } = await params;
  return <PublicChatView shareId={shareId} />;
}
