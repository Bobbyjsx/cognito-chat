"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#ffffff",
          color: "#111111",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#111111",
            color: "#ffffff",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
