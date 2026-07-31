"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const ERROR_MAP: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There is a problem with the server configuration. Check if your environment variables (NEXTAUTH_SECRET, ATLAS_API_KEY, NEXT_PUBLIC_API_URL) are set in Cloudflare dashboard.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in or access this resource.",
  },
  Verification: {
    title: "Verification Link Expired",
    description: "The sign-in link has expired or has already been used.",
  },
  CredentialsSignin: {
    title: "Invalid Credentials",
    description: "The email or password you provided is incorrect.",
  },
  RefreshAccessTokenError: {
    title: "Session Expired",
    description: "Your session token could not be refreshed. Please sign in again to continue.",
  },
  Default: {
    title: "Authentication Failed",
    description: "An unexpected error occurred during authentication. Please try again or contact support if the issue persists.",
  },
};

export function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "Default";
  const errorInfo = ERROR_MAP[errorType] || ERROR_MAP.Default;

  return (
    <motion.div
      className="w-full max-w-[420px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo className="justify-center mb-3" />
      </div>

      <Card className="ambient-shadow border border-[rgba(0,0,0,0.06)] bg-white p-2">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-semibold text-on-surface">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="rounded-lg bg-surface-container-low p-3 text-xs text-muted-foreground font-mono text-center">
            Error Code: <span className="text-on-surface font-semibold">{errorType}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button className="w-full" onClick={() => window.location.href = "/login"}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Return to Sign In
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => window.location.href = "/"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
