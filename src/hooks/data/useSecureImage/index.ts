import { useState, useEffect } from "react";
import { api } from "@/lib/axios";

export function useSecureImage(src: string | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrl(null);
      return;
    }

    // If it's already a blob or data URL, just use it directly
    if (
      src.startsWith("blob:") ||
      src.startsWith("data:") ||
      src.startsWith("http://localhost:3000")
    ) {
      setObjectUrl(src);
      return;
    }

    let isMounted = true;
    let urlToRevoke: string | null = null;
    setObjectUrl(null); // Clear old image immediately to prevent flashes
    setLoading(true);
    setError(false);

    api
      .get(src, { responseType: "blob" })
      .then((res) => {
        if (isMounted) {
          const url = URL.createObjectURL(res.data);
          urlToRevoke = url;
          setObjectUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [src]);

  return { objectUrl, loading, error };
}
