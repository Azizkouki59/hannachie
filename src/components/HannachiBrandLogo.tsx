"use client";

import { useId } from "react";

export interface HannachiBrandLogoProps {
  size?: number;
  className?: string;
}

/**
 * Bespoke precision engineering emblem for Hannachi Elektrohaushaltsgeräte & Ersatzteile Osnabrück.
 * Combines a chamfered industrial chassis frame, geometric "H" monogram, and a calibrated
 * appliance-drum/circuit arc with crisp legibility at every mobile and desktop size.
 */
export default function HannachiBrandLogo({
  size = 32,
  className = "",
}: HannachiBrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  const bgGradId = `hannachi-logo-bg-${uid}`;
  const ringGradId = `hannachi-logo-ring-${uid}`;
  const accentGradId = `hannachi-logo-accent-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`.trim()}
    >
      <defs>
        <linearGradient id={bgGradId} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="55%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#082F49" />
        </linearGradient>
        <linearGradient id={ringGradId} x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={accentGradId} x1="10" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Precision rounded chassis frame */}
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="10.5"
        fill={`url(#${bgGradId})`}
        stroke={`url(#${ringGradId})`}
        strokeWidth="1.5"
      />

      {/* Subtle inner bevel hairline */}
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="8"
        stroke="#FFFFFF"
        strokeOpacity="0.08"
        strokeWidth="1"
      />

      {/* Subtle appliance drum calibration arc behind monogram */}
      <circle
        cx="20"
        cy="20"
        r="12.5"
        stroke="#38BDF8"
        strokeOpacity="0.22"
        strokeWidth="1.25"
        strokeDasharray="19 8"
      />

      {/* Architectural "H" Monogram — Left & Right Pillars */}
      <rect x="11.25" y="10.5" width="3.75" height="19" rx="1.6" fill="#FFFFFF" />
      <rect x="25" y="10.5" width="3.75" height="19" rx="1.6" fill="#FFFFFF" />

      {/* Precision Sky-Blue Diagnostic Crossbar */}
      <rect x="14.2" y="18.1" width="11.6" height="3.8" rx="1.5" fill={`url(#${accentGradId})`} />

      {/* Calibrated Top-Right Precision Status Micro-Node */}
      <circle cx="31.2" cy="8.8" r="2" fill="#38BDF8" />
    </svg>
  );
}
