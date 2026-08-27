"use client";

import NextError from "next/error";
import { useEffect } from "react";
import { Analytics } from "@/lib/analytics";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Analytics.captureError(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
