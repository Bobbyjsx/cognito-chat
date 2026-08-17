import { initiateOAuth } from "@/lib/actions/oauth";

export async function GET() {
  await initiateOAuth();
}

