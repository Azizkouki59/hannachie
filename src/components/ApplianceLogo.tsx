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
 * High-precision dual-tone vector appliance logos engineered on an optical 32x32 grid:
 * Washing Machine, Fridge/Freezer, Dishwasher, Oven/Stove, and Other Appliances.
 * Uses subtle translucent interior fills + crisp dual stroke weights for retina clarity on mobile & PC.
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
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`shrink-0 ${className}`.trim()}
      >
        {/* Chassis with subtle depth fill */}
        <rect
          x="4.5"
          y="3"
          width="23"
          height="26"
          rx="3.5"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Top console panel */}
        <path
          d="M4.5 9.5H27.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Detergent drawer */}
        <rect
          x="7.5"
          y="5.4"
          width="6.5"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.85"
        />
        {/* Program dial + indicator LEDs */}
        <circle cx="17.8" cy="6.4" r="1.2" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="21.8" cy="6.4" r="0.95" fill="currentColor" />
        <circle cx="24.4" cy="6.4" r="0.85" fill="currentColor" fillOpacity="0.55" />
        {/* Outer porthole rim */}
        <circle
          cx="16"
          cy="19"
          r="6.6"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Inner stainless drum ring */}
        <circle
          cx="16"
          cy="19"
          r="4.5"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeOpacity="0.45"
          strokeDasharray="2.5 2"
        />
        {/* Calibrated water wave inside drum */}
        <path
          d="M11.6 19.6C12.9 18 14.5 18 16 19.4C17.5 20.8 19.1 20.8 20.4 19.2"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
        />
        {/* Glass reflection highlight */}
        <path
          d="M12.7 15.6C13.5 14.8 14.7 14.4 16 14.4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />
      </svg>
    );
  }

  if (category === "fridge") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`shrink-0 ${className}`.trim()}
      >
        {/* Tall refrigerator chassis */}
        <rect
          x="6.5"
          y="2.75"
          width="19"
          height="26.5"
          rx="3.4"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Freezer compartment tint */}
        <path
          d="M7.4 18.2H24.6V26C24.6 27.3 23.5 28.4 22.2 28.4H9.8C8.5 28.4 7.4 27.3 7.4 26V18.2Z"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Door split seam */}
        <line x1="6.5" y1="18" x2="25.5" y2="18" stroke="currentColor" strokeWidth="1.65" />
        {/* Upper & lower stainless handles */}
        <line
          x1="10.4"
          y1="7.5"
          x2="10.4"
          y2="14.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="10.4"
          y1="21.2"
          x2="10.4"
          y2="25.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* 6-point cooling snowflake emblem */}
        <path
          d="M18.8 7.5V13.7M16.1 9.05L21.5 12.15M21.5 9.05L16.1 12.15"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
        <circle cx="18.8" cy="10.6" r="1" fill="currentColor" />
        {/* Digital temperature display bar */}
        <rect
          x="16.2"
          y="22.4"
          width="5.6"
          height="1.7"
          rx="0.85"
          fill="currentColor"
          fillOpacity="0.65"
        />
      </svg>
    );
  }

  if (category === "dishwasher") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`shrink-0 ${className}`.trim()}
      >
        {/* Chassis */}
        <rect
          x="4.5"
          y="3"
          width="23"
          height="26"
          rx="3.5"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Control panel divider */}
        <line x1="4.5" y1="9.2" x2="27.5" y2="9.2" stroke="currentColor" strokeWidth="1.5" />
        {/* Recessed handle & LEDs */}
        <line
          x1="11.5"
          y1="6.1"
          x2="20.5"
          y2="6.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="8" cy="6.1" r="0.95" fill="currentColor" />
        <circle cx="24" cy="6.1" r="0.95" fill="currentColor" fillOpacity="0.6" />
        {/* Stacked plates & sparkling dishes */}
        <circle
          cx="12.6"
          cy="18.4"
          r="3.8"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="18.4"
          cy="15.8"
          r="3.1"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeOpacity="0.8"
        />
        {/* Lower spray rack line */}
        <path
          d="M8.5 24.4H16.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        {/* Crisp water droplet */}
        <path
          d="M21.8 19.8C21.8 19.8 24 22.3 24 23.6C24 24.9 23 25.9 21.8 25.9C20.6 25.9 19.6 24.9 19.6 23.6C19.6 22.3 21.8 19.8 21.8 19.8Z"
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
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`shrink-0 ${className}`.trim()}
      >
        {/* Oven body */}
        <rect
          x="4.5"
          y="3.5"
          width="23"
          height="25"
          rx="3.4"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* 4 Rotary control knobs */}
        <circle cx="9.2" cy="7.2" r="1.15" fill="currentColor" />
        <circle cx="13.7" cy="7.2" r="1.15" fill="currentColor" />
        <circle cx="18.3" cy="7.2" r="1.15" fill="currentColor" />
        <circle cx="22.8" cy="7.2" r="1.15" fill="currentColor" />
        {/* Console separator */}
        <line x1="4.5" y1="10.6" x2="27.5" y2="10.6" stroke="currentColor" strokeWidth="1.5" />
        {/* Stainless oven handle */}
        <line
          x1="10.5"
          y1="13.4"
          x2="21.5"
          y2="13.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Viewing glass window */}
        <rect
          x="8.2"
          y="16"
          width="15.6"
          height="9.2"
          rx="2"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        {/* Radiant heat wave inside oven cavity */}
        <path
          d="M11.6 22.2C12.4 20.4 13.3 19.7 14 21.2C14.8 19.2 16 18.9 16.8 20.9C17.6 19.6 18.6 20.2 19.4 22.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top grill element hairline */}
        <line
          x1="11.2"
          y1="18.2"
          x2="20.8"
          y2="18.2"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      </svg>
    );
  }

  // "other" — Sonstiges Gerät (Trockner / Kaffeevollautomat / Mikrowelle / Elektronik)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`.trim()}
    >
      {/* Appliance / inverter unit housing */}
      <rect
        x="3.5"
        y="6"
        width="25"
        height="17.5"
        rx="3.4"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Illuminated diagnostic display window */}
      <rect
        x="6.8"
        y="9.4"
        width="13"
        height="10.7"
        rx="2"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      {/* High-precision electrical pulse bolt */}
      <path
        d="M14.1 11.8L11.8 15.1H14.5L12.4 18.1"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rotary dials on right control column */}
      <circle cx="24" cy="11.8" r="1.45" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="24" cy="16.3" r="1.45" fill="currentColor" />
      <line
        x1="22.8"
        y1="19.6"
        x2="25.2"
        y2="19.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
      {/* Precision rubberized base rail */}
      <line
        x1="8.5"
        y1="26.5"
        x2="23.5"
        y2="26.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
