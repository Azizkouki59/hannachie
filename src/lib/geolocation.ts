export type BrowserGeolocationResult =
  | {
      ok: true;
      lat: number;
      lng: number;
      accuracy: number;
    }
  | {
      ok: false;
      reason: "denied" | "policy_blocked" | "unavailable" | "timeout" | "unsupported";
      message: string;
    };

function mapPositionError(err: GeolocationPositionError): BrowserGeolocationResult {
  const rawMsg = (err?.message || "").toLowerCase();
  const isPolicyBlocked =
    rawMsg.includes("permissions policy") ||
    rawMsg.includes("feature policy") ||
    rawMsg.includes("only secure origins");

  if (err.code === err.PERMISSION_DENIED) {
    if (isPolicyBlocked) {
      return {
        ok: false,
        reason: "policy_blocked",
        message:
          "Standortabfrage ist in dieser eingebetteten Ansicht blockiert. Bitte wählen Sie Ihren Ort auf der Karte oder geben Sie Ihre PLZ ein.",
      };
    }
    return {
      ok: false,
      reason: "denied",
      message:
        "Standortfreigabe wurde im Browser abgelehnt. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen oder wählen Sie Ihren Ort auf der Karte.",
    };
  }

  if (err.code === err.TIMEOUT) {
    return {
      ok: false,
      reason: "timeout",
      message:
        "Standort-Erkennung hat zu lange gedauert. Bitte erneut versuchen oder Ihren Ort direkt auf der Karte suchen.",
    };
  }

  return {
    ok: false,
    reason: "unavailable",
    message:
      "Ihr Standort konnte aktuell nicht ermittelt werden. Bitte wählen Sie Ihren Ort über die Karte oder PLZ aus.",
  };
}

/**
 * Two-stage browser geolocation helper:
 * 1) Checks Permissions API when available to fail fast if already explicitly denied.
 * 2) Tries high-accuracy GPS first (8s timeout for mobile GPS cold start).
 * 3) On POSITION_UNAVAILABLE or TIMEOUT (common on desktops/laptops without hardware GPS),
 *    automatically retries with Wi-Fi / network positioning (`enableHighAccuracy: false`).
 * 4) Includes a hard safety timer so the UI never hangs indefinitely in "locating" state.
 */
export async function getBrowserPositionWithFallback(): Promise<BrowserGeolocationResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return {
      ok: false,
      reason: "unsupported",
      message:
        "Standortabfrage wird von diesem Browser nicht unterstützt. Bitte wählen Sie Ihren Ort über die Karte oder PLZ aus.",
    };
  }

  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return {
      ok: false,
      reason: "policy_blocked",
      message:
        "Standortabfrage erfordert eine sichere HTTPS-Verbindung. Bitte wählen Sie Ihren Ort direkt aus.",
    };
  }

  // Fail fast if permission is already explicitly denied in the browser
  try {
    if ("permissions" in navigator && typeof navigator.permissions?.query === "function") {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      if (status.state === "denied") {
        return {
          ok: false,
          reason: "denied",
          message:
            "Standortfreigabe ist im Browser blockiert. Bitte erlauben Sie den Standortzugriff oder wählen Sie Ihren Ort auf der Karte.",
        };
      }
    }
  } catch {
    // Ignore browsers that reject permissions.query("geolocation")
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (res: BrowserGeolocationResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(safetyTimer);
      resolve(res);
    };

    const safetyTimer = window.setTimeout(() => {
      finish({
        ok: false,
        reason: "timeout",
        message:
          "Standort-Erkennung hat nicht rechtzeitig geantwortet. Bitte erneut versuchen oder Ihren Ort auf der Karte wählen.",
      });
    }, 16000);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finish({
            ok: true,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 30,
          });
        },
        (firstError) => {
          // If permission was denied or blocked by iframe policy, don't retry
          if (firstError.code === firstError.PERMISSION_DENIED) {
            finish(mapPositionError(firstError));
            return;
          }

          // Desktop/laptop or indoor fallback: retry with Wi-Fi / network positioning
          try {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                finish({
                  ok: true,
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy: pos.coords.accuracy || 250,
                });
              },
              (secondError) => {
                finish(mapPositionError(secondError));
              },
              {
                enableHighAccuracy: false,
                timeout: 7000,
                maximumAge: 300000,
              }
            );
          } catch {
            finish(mapPositionError(firstError));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        }
      );
    } catch {
      finish({
        ok: false,
        reason: "unavailable",
        message:
          "Standortabfrage wird aktuell blockiert. Bitte wählen Sie Ihren Ort über die Karte oder PLZ aus.",
      });
    }
  });
}
