import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/axios";
import {
  isUrlExpired,
  fetchFreshAttachmentUrl,
} from "@/hooks/data/useAttachments/useAttachments";

/** Clean common React JSX attributes from SVG markup so the browser's native XML parser accepts it. */
export function sanitizeSvgMarkup(raw: string): string {
  let cleaned = raw;
  cleaned = cleaned.replace(/width=\{[^}]+\}/g, 'width="100%"');
  cleaned = cleaned.replace(/height=\{[^}]+\}/g, 'height="100%"');
  cleaned = cleaned.replace(/className=\{[^}]+\}/g, "");
  cleaned = cleaned.replace(/\{\.\.\.[^}]+\}/g, "");
  cleaned = cleaned.replace(/=([a-zA-Z0-9_]+)(?=[ >/])/g, '="$1"');
  return cleaned;
}

export interface UseSecureImageOptions {
  attachmentId?: string;
  urlExpiresAt?: string | Date | null;
  maxRetries?: number;
}

export function useSecureImage(
  src: string | null,
  options?: UseSecureImageOptions,
) {
  const { attachmentId, urlExpiresAt, maxRetries = 2 } = options ?? {};
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAttemptedSvgFix, setHasAttemptedSvgFix] = useState(false);

  // Sync retry count and error when src prop changes (React 19 pattern: adjusting state during render)
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setRetryCount(0);
    setError(false);
    setFetchedUrl(null);
    setHasAttemptedSvgFix(false);
  }

  const isBlobOrData = Boolean(
    src && (src.startsWith("blob:") || src.startsWith("data:")),
  );
  const isInternalContentEndpoint = Boolean(
    src && src.includes("/agent/attachments/") && src.includes("/content"),
  );
  const isExternalUrl = Boolean(
    src &&
    (src.startsWith("http://") || src.startsWith("https://")) &&
    !isInternalContentEndpoint,
  );

  const retry = useCallback(() => {
    setError(false);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let urlToRevoke: string | null = null;

    const isExpired = isUrlExpired(urlExpiresAt);
    const needsFetch =
      (isExpired || retryCount > 0) && attachmentId
        ? true
        : !src
          ? false
          : isInternalContentEndpoint;

    if (!needsFetch) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(false);

      if ((isExpired || retryCount > 0) && attachmentId) {
        try {
          const fresh = await fetchFreshAttachmentUrl(attachmentId);
          if (!isMounted) return;
          if (fresh.url) {
            setFetchedUrl(fresh.url);
            setLoading(false);
            return;
          }
        } catch {
          if (!isMounted) return;
        }
      }

      if (src && isInternalContentEndpoint) {
        try {
          const res = await api.get(src, { responseType: "blob" });
          if (!isMounted) return;
          const url = URL.createObjectURL(res.data);
          urlToRevoke = url;
          setFetchedUrl(url);
          setLoading(false);
        } catch {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        }
      } else if (!src) {
        setError(true);
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [src, attachmentId, urlExpiresAt, retryCount, isInternalContentEndpoint]);

  // Derived objectUrl: prefers fresh fetched URL (e.g. from retry/refresh), then direct src
  const objectUrl = fetchedUrl || (isBlobOrData || isExternalUrl ? src : null);

  const handleImageError = useCallback(async () => {
    const currentUrl = objectUrl || src;
    const isSvg =
      currentUrl &&
      (currentUrl.endsWith(".svg") ||
        currentUrl.includes(".svg?") ||
        currentUrl.includes("image/svg+xml"));

    if (isSvg && !hasAttemptedSvgFix && currentUrl) {
      setHasAttemptedSvgFix(true);
      try {
        const res = await fetch(currentUrl);
        if (res.ok) {
          const text = await res.text();
          if (text.includes("={") || text.includes("{...")) {
            const cleaned = sanitizeSvgMarkup(text);
            const blob = new Blob([cleaned], { type: "image/svg+xml" });
            const blobUrl = URL.createObjectURL(blob);
            setFetchedUrl(blobUrl);
            setError(false);
            return true;
          }
        }
      } catch {
        // Fall through to normal retry
      }
    }

    // If image failed to load and we have attachmentId and retries left:
    if (attachmentId && retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1);
      return true;
    }
    setError(true);
    return false;
  }, [
    objectUrl,
    src,
    hasAttemptedSvgFix,
    attachmentId,
    retryCount,
    maxRetries,
  ]);

  return {
    objectUrl,
    loading,
    error,
    retry,
    handleImageError,
    retryCount,
  };
}
