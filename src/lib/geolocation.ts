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
          "Standortabfrage ist in dieser eingebetteten Vorschau deaktiviert. Bitte wählen Sie unten Ihren Ort oder öffnen Sie die App direkt im Browser.",
      };
    }
    return {
      ok: false,
      reason: "denied",
      message:
        "Standortfreigabe wurde im Browser abgelehnt. Bitte erlauben Sie den Standortzugriff oder wählen Sie Ihren Ort aus.",
    };
  }

  if (err.code === err.TIMEOUT) {
    return {
      ok: false,
      reason: "timeout",
      message:
        "GPS-Ortung hat zu lange gedauert. Zeige Einsatzgebiet Osnabrück.",
    };
  }

  return {
    ok: false,
    reason: "unavailable",
    message:
      "Standort konnte aktuell nicht ermittelt werden. Zeige Einsatzgebiet Osnabrück.",
  };
}

/**
 * Two-stage browser geolocation helper:
 * 1) Tries high-accuracy GPS first (short timeout for mobile devices).
 * 2) On POSITION_UNAVAILABLE or TIMEOUT (common on desktops/laptops without hardware GPS),
 *    automatically retries with coarse Wi-Fi/network positioning (`enableHighAccuracy: false`).
 * 3) Includes a hard safety timer so the UI never hangs indefinitely in "locating" state.
 */
export function getBrowserPositionWithFallback(): Promise<BrowserGeolocationResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve({
      ok: false,
      reason: "unsupported",
      message:
        "Standortabfrage wird von diesem Browser nicht unterstützt. Zeige Einsatzgebiet Osnabrück.",
    });
  }

  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return Promise.resolve({
      ok: false,
      reason: "policy_blocked",
      message:
        "Standortabfrage erfordert eine sichere HTTPS-Verbindung. Zeige Einsatzgebiet Osnabrück.",
    });
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
          "GPS-Ortung hat nicht rechtzeitig geantwortet. Zeige Einsatzgebiet Osnabrück.",
      });
    }, 12000);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finish({
            ok: true,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 50,
          });
        },
        (firstError) => {
          // If permission was denied or blocked by iframe policy, don't retry
          if (firstError.code === firstError.PERMISSION_DENIED) {
            finish(mapPositionError(firstError));
            return;
          }

          // Desktop/laptop fallback: retry with Wi-Fi / network positioning
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
                timeout: 6500,
                maximumAge: 300000,
              }
            );
          } catch {
            finish(mapPositionError(firstError));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 4500,
          maximumAge: 60000,
        }
      );
    } catch {
      finish({
        ok: false,
        reason: "unavailable",
        message:
          "Standortabfrage wird aktuell blockiert. Zeige Einsatzgebiet Osnabrück.",
      });
    }
  });
}
