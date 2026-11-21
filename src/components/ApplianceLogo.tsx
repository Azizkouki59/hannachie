"use client";

export type ApplianceCategoryId =
  | "washer"
  | "fridge"
  | "dishwasher"
  | "oven"
  | "other";

export function resolveApplianceCategory(deviceName: string): ApplianceCategoryId {
  const clean = deviceName.trim().toLowerCase();
  if (clean.includes("wasch")) return "washer";
  if (clean.includes("kühl") || clean.includes("kuehl") || clean.includes("gefrier")) {
    return "fridge";
  }
  if (clean.includes("spül") || clean.includes("spuel") || clean.includes("geschirr")) {
    return "dishwasher";
  }
  if (
    clean.includes("herd") ||
    clean.includes("ofen") ||
    clean.includes("back") ||
    clean.includes("ceran") ||
    clean.includes("induktion")
  ) {
    return "oven";
  }
  return "other";
}

export interface ApplianceLogoProps {
  device: string;
  size?: number;
  className?: string;
}

/**
 * Unique bespoke vector appliance logos for each household device category:
 * Washing Machine, Fridge/Freezer, Dishwasher, Oven/Stove, and Other Appliances.
 */
export default function ApplianceLogo({
  device,
  size = 24,
  className = "",
}: ApplianceLogoProps) {
  const category = resolveApplianceCategory(device);

  if (category === "washer") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <rect
          x="4"
          y="3"
          width="20"
          height="22"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <line x1="4" y1="8.5" x2="24" y2="8.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="7" y="5" width="5" height="1.8" rx="0.9" fill="currentColor" />
        <circle cx="19.5" cy="5.8" r="1.1" fill="currentColor" />
        <circle cx="16" cy="5.8" r="0.9" fill="currentColor" opacity="0.65" />
        <circle cx="14" cy="16.5" r="5.3" stroke="currentColor" strokeWidth="1.9" />
        <path
          d="M10.5 16.8C11.7 15.3 13 15.3 14 16.5C15 17.7 16.3 17.7 17.5 16.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (category === "fridge") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <rect
          x="6"
          y="2.8"
          width="16"
          height="22.4"
          rx="2.8"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <line x1="6" y1="15.5" x2="22" y2="15.5" stroke="currentColor" strokeWidth="1.7" />
        <line
          x1="9.5"
          y1="7"
          x2="9.5"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <line
          x1="9.5"
          y1="18.2"
          x2="9.5"
          y2="21.5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M16.5 6.8V11.2M14.6 7.9L18.4 10.1M18.4 7.9L14.6 10.1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (category === "dishwasher") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <rect
          x="4"
          y="3"
          width="20"
          height="22"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <line x1="4" y1="8.2" x2="24" y2="8.2" stroke="currentColor" strokeWidth="1.6" />
        <line
          x1="10.5"
          y1="5.6"
          x2="17.5"
          y2="5.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="11" cy="16.2" r="3.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.5" cy="14.5" r="2.7" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        <path
          d="M18.8 18.8C18.8 18.8 20.6 20.8 20.6 21.8C20.6 22.8 19.8 23.5 18.8 23.5C17.8 23.5 17 22.8 17 21.8C17 20.8 18.8 18.8 18.8 18.8Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (category === "oven") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        <rect
          x="4"
          y="4"
          width="20"
          height="21"
          rx="2.8"
          stroke="currentColor"
          strokeWidth="1.9"
        />
        <circle cx="8.5" cy="6.8" r="1" fill="currentColor" />
        <circle cx="12.2" cy="6.8" r="1" fill="currentColor" />
        <circle cx="15.8" cy="6.8" r="1" fill="currentColor" />
        <circle cx="19.5" cy="6.8" r="1" fill="currentColor" />
        <line x1="4" y1="9.6" x2="24" y2="9.6" stroke="currentColor" strokeWidth="1.6" />
        <line
          x1="9.5"
          y1="12"
          x2="18.5"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <rect
          x="7.5"
          y="14.2"
          width="13"
          height="7.5"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M10.5 19C11.2 17.5 12 16.8 12.6 18.2C13.3 16.5 14.3 16.2 15 17.8C15.7 16.8 16.6 17.4 17.3 19"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // "other" — Sonstiges Gerät (Trockner / Kaffeevollautomat / Mikrowelle / Elektronik)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="3.5"
        y="5.5"
        width="21"
        height="15"
        rx="2.8"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <rect
        x="6.2"
        y="8.4"
        width="11"
        height="9.2"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12.2 10.7L10.6 13.1H12.8L11.2 15.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20.6" cy="10.2" r="1.2" fill="currentColor" />
      <circle cx="20.6" cy="14.2" r="1.2" fill="currentColor" />
      <line
        x1="7.5"
        y1="23.2"
        x2="20.5"
        y2="23.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
