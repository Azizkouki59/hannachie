import { useEffect, useState } from "react";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", notify);
}

export function navigateTo(href: string) {
  if (typeof window === "undefined") return;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/\\")) return;

  try {
    const url = new URL(trimmed, window.location.origin);
    if (url.origin !== window.location.origin) return;

    window.history.pushState({}, "", url.pathname + url.search + url.hash);
    notify();

    if (url.hash) {
      const id = url.hash.slice(1);
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  } catch {
    // Ignore malformed navigation URLs
  }
}

export function updateUrlSearchParams(
  updates: Record<string, string | null | undefined>,
  options?: { replace?: boolean }
) {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const search = params.toString();
    const nextSearch = search ? `?${search}` : "";
    const currentUrl =
      (window.location.pathname || "/") +
      window.location.search +
      window.location.hash;
    const nextUrl =
      (window.location.pathname || "/") + nextSearch + window.location.hash;

    if (nextUrl === currentUrl) return;

    if (options?.replace) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
    notify();
  } catch {
    // Ignore malformed URL updates
  }
}

export function useLocationState() {
  const [loc, setLoc] = useState(() => ({
    pathname: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
  }));

  useEffect(() => {
    const update = () => {
      setLoc({
        pathname: window.location.pathname || "/",
        search: window.location.search,
        hash: window.location.hash,
      });
    };
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return loc;
}

export function usePathname(): string {
  return useLocationState().pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(useLocationState().search);
}

export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
  }
}

export function notFound(): never {
  throw new NotFoundError();
}
