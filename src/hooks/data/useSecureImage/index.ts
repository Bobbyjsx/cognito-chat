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

interface CachedImageRecord {
  url: string;
  isBlob: boolean;
  expiresAt?: number;
  timestamp: number;
}

const MAX_IMAGE_CACHE_SIZE = 150;
const imageCache = new Map<string, CachedImageRecord>();
const loadedImageUrls = new Set<string>();

/**
 * Record that a given image URL has successfully loaded in the browser.
 */
export function markImageLoaded(url: string | null | undefined): void {
  if (url) {
    loadedImageUrls.add(url);
  }
}

/**
 * Check whether a given image URL is already loaded and decoded in browser cache.
 */
export function isImagePreloaded(url: string | null | undefined): boolean {
  return Boolean(url && loadedImageUrls.has(url));
}

/**
 * Retrieve cached URL for a given attachment or src key.
 */
export function getCachedImageUrl(key: string): string | null {
  const record = imageCache.get(key);
  if (!record) return null;
  if (record.expiresAt && Date.now() >= record.expiresAt) {
    imageCache.delete(key);
    return null;
  }
  return record.url;
}

/**
 * Store a resolved URL or blob URL in the shared image cache.
 */
export function setCachedImageUrl(
  key: string,
  url: string,
  isBlob: boolean,
  expiresAt?: number,
): void {
  if (!key || !url) return;
  if (imageCache.size >= MAX_IMAGE_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value;
    if (firstKey) {
      const old = imageCache.get(firstKey);
      if (old?.isBlob && typeof window !== "undefined") {
        try {
          URL.revokeObjectURL(old.url);
        } catch {
          // ignore
        }
      }
      imageCache.delete(firstKey);
    }
  }
  imageCache.set(key, {
    url,
    isBlob,
    expiresAt,
    timestamp: Date.now(),
  });
}

/**
 * Preload an image URL into browser cache.
 */
export function preloadImage(
  src: string | null | undefined,
  attachmentId?: string,
): Promise<string | null> {
  if (!src && !attachmentId) return Promise.resolve(null);
  const key = attachmentId ? `att:${attachmentId}` : src ? `src:${src}` : "";
  const cached = key ? getCachedImageUrl(key) : null;
  const targetUrl = cached || src;

  if (!targetUrl) return Promise.resolve(null);
  if (isImagePreloaded(targetUrl)) {
    return Promise.resolve(targetUrl);
  }

  if (
    typeof window !== "undefined" &&
    (targetUrl.startsWith("http://") ||
      targetUrl.startsWith("https://") ||
      targetUrl.startsWith("blob:") ||
      targetUrl.startsWith("/"))
  ) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        markImageLoaded(targetUrl);
        resolve(targetUrl);
      };
      img.onerror = () => resolve(null);
      img.src = targetUrl;
    });
  }

  return Promise.resolve(targetUrl);
}

export function useSecureImage(
  src: string | null,
  options?: UseSecureImageOptions,
) {
  const { attachmentId, urlExpiresAt, maxRetries = 2 } = options ?? {};

  const cacheKey = attachmentId
    ? `att:${attachmentId}`
    : src
      ? `src:${src}`
      : "";
  const initialCached = cacheKey ? getCachedImageUrl(cacheKey) : null;

  const [fetchedUrl, setFetchedUrl] = useState<string | null>(initialCached);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAttemptedSvgFix, setHasAttemptedSvgFix] = useState(false);
  const [error, setError] = useState(false);

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

  const isExpired = isUrlExpired(urlExpiresAt);
  const needsFetch = Boolean(
    (isExpired || retryCount > 0) && attachmentId
      ? true
      : !src && attachmentId
        ? true
        : isInternalContentEndpoint,
  );

  const [loading, setLoading] = useState<boolean>(!initialCached && needsFetch);

  // Sync state when cacheKey changes (React 19 render-phase state adjustment)
  const [prevKey, setPrevKey] = useState(cacheKey);
  if (prevKey !== cacheKey) {
    setPrevKey(cacheKey);
    const freshCached = cacheKey ? getCachedImageUrl(cacheKey) : null;
    setFetchedUrl(freshCached);
    setRetryCount(0);
    setError(false);
    setHasAttemptedSvgFix(false);
    setLoading(!freshCached && needsFetch);
  }

  const retry = useCallback(() => {
    setError(false);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!needsFetch) {
      return;
    }

    const load = async () => {
      // Check shared cache first before triggering network requests
      if (cacheKey && !isExpired && retryCount === 0) {
        const cached = getCachedImageUrl(cacheKey);
        if (cached) {
          if (!isMounted) return;
          setFetchedUrl(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(false);

      if (attachmentId && (isExpired || retryCount > 0 || !src)) {
        try {
          const fresh = await fetchFreshAttachmentUrl(attachmentId);
          if (!isMounted) return;
          if (fresh.url) {
            const exp = fresh.urlExpiresAt
              ? new Date(fresh.urlExpiresAt).getTime()
              : undefined;
            if (cacheKey) {
              setCachedImageUrl(cacheKey, fresh.url, false, exp);
            }
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
          const cachedBlob = cacheKey ? getCachedImageUrl(cacheKey) : null;
          if (cachedBlob) {
            if (!isMounted) return;
            setFetchedUrl(cachedBlob);
            setLoading(false);
            return;
          }

          const res = await api.get(src, { responseType: "blob" });
          if (!isMounted) return;
          const url = URL.createObjectURL(res.data);
          if (cacheKey) {
            setCachedImageUrl(cacheKey, url, true);
          }
          setFetchedUrl(url);
          setLoading(false);
          return;
        } catch {
          if (!isMounted) return;
        }
      }

      if (!src) {
        setError(true);
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [
    src,
    attachmentId,
    urlExpiresAt,
    retryCount,
    isInternalContentEndpoint,
    cacheKey,
    isExpired,
    needsFetch,
    fetchedUrl,
  ]);

  // Derived objectUrl: prefers fresh fetched URL (or cached URL), then direct src
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
            if (cacheKey) {
              setCachedImageUrl(cacheKey, blobUrl, true);
            }
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
    cacheKey,
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
