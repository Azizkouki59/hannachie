import { useId } from "react";

/**
 * Domain-authentic animated backdrop tailored to Hannachi Elektrohaushaltsgeräte & Ersatzteile Osnabrück:
 * - Rotating front-loader washing machine drum with 3 lifters & water wave
 * - Interlocking spare-parts precision gear (Ersatzteil-Zahnrad) & swinging service wrench
 * - Floating appliance schematics (Kältetechnik snowflake & Backofen heating element)
 * - Lower-edge Osnabrück Vor-Ort-Service route with gliding service van & location pins
 * - Protective dark left contrast scrim so white headlines stay 100% legible on all viewports
 */
export function HeroAnimatedBackdrop() {
  const uid = useId().replace(/:/g, "");
  const waveGradPrimary = `hannachi-wave-primary-${uid}`;
  const waveGradSecondary = `hannachi-wave-secondary-${uid}`;
  const waveFill = `hannachi-wave-fill-${uid}`;
  const drumGlow = `hannachi-drum-glow-${uid}`;

  return (
    <>
      {/* Layer 1: Technical blueprint grid, diagonal light sweep & protective dark text scrim */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(186,230,253,0.55) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            WebkitMaskImage:
              "radial-gradient(ellipse 90% 95% at 78% 35%, black 18%, transparent 82%)",
            maskImage:
              "radial-gradient(ellipse 90% 95% at 78% 35%, black 18%, transparent 82%)",
          }}
        />

        {/* Sweeping diagonal cyan light beam */}
        <div className="hero-ambient-sheen absolute -inset-y-1/2 -left-1/3 w-[170%]" />

        {/* Protective left dark gradient scrim so white headlines stay crisp */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.84)_0%,rgba(2,6,23,0.56)_54%,rgba(2,6,23,0.20)_100%)]" />
      </div>

      {/* Layer 2: Hannachi Appliance & Vor-Ort-Service Schematics */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Drifting Ambient Glow Orbs */}
        <div className="hero-orb-float-1 absolute -top-20 -right-16 h-64 w-64 sm:h-88 sm:w-88 rounded-full bg-sky-400/16 blur-3xl" />
        <div className="hero-orb-float-2 absolute -bottom-24 -left-16 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-cyan-500/14 blur-3xl" />

        {/* Right-Side Technical Blueprint: Washing Machine Drum + Interlocking Spare-Part Gear + Wrench */}
        <div className="absolute -right-10 sm:right-4 lg:right-10 top-1/2 -translate-y-1/2 h-56 w-56 sm:h-72 sm:w-72 opacity-65 sm:opacity-75">
          {/* Washing Machine Blueprint Housing & Rotating Drum */}
          <svg
            viewBox="0 0 220 220"
            className="h-full w-full text-sky-300"
            fill="none"
          >
            <defs>
              <radialGradient id={drumGlow} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.22)" />
                <stop offset="70%" stopColor="rgba(14, 165, 233, 0.06)" />
                <stop offset="100%" stopColor="rgba(2, 6, 23, 0)" />
              </radialGradient>
            </defs>

            {/* Outer Appliance Chassis Outline */}
            <rect
              x="26"
              y="18"
              width="148"
              height="184"
              rx="18"
              stroke="rgba(125, 211, 252, 0.26)"
              strokeWidth="1.5"
              fill="rgba(15, 23, 42, 0.28)"
            />
            {/* Top Control Panel Divider */}
            <line
              x1="26"
              y1="52"
              x2="174"
              y2="52"
              stroke="rgba(125, 211, 252, 0.22)"
              strokeWidth="1.25"
            />
            {/* Detergent Drawer */}
            <rect
              x="38"
              y="28"
              width="38"
              height="14"
              rx="3"
              stroke="rgba(125, 211, 252, 0.32)"
              strokeWidth="1.2"
            />
            {/* Program Dial & LED Indicators */}
            <circle
              cx="100"
              cy="35"
              r="7"
              stroke="rgba(56, 189, 248, 0.5)"
              strokeWidth="1.5"
            />
            <circle cx="136" cy="35" r="2.5" fill="rgba(52, 211, 153, 0.85)" />
            <circle cx="146" cy="35" r="2.5" fill="rgba(56, 189, 248, 0.65)" />
            <circle cx="156" cy="35" r="2.5" fill="rgba(56, 189, 248, 0.35)" />

            {/* Outer Porthole Door Ring */}
            <circle cx="100" cy="124" r="56" fill={`url(#${drumGlow})`} />
            <circle
              cx="100"
              cy="124"
              r="54"
              stroke="rgba(125, 211, 252, 0.38)"
              strokeWidth="2"
            />
            <circle
              cx="100"
              cy="124"
              r="47"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="1.2"
              strokeDasharray="5 4"
            />

            {/* Water Level Wave Inside Drum */}
            <path
              d="M 56 134 Q 78 124 100 134 T 144 134"
              stroke="rgba(56, 189, 248, 0.45)"
              strokeWidth="1.75"
              fill="none"
            />
          </svg>

          {/* Rotating Inner Stainless-Steel Drum (3 Paddles + Perforations) */}
          <div className="hero-ring-cw absolute left-[45.45%] top-[56.36%] -translate-x-1/2 -translate-y-1/2 h-[38%] w-[38%]">
            <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="1.75"
                strokeDasharray="6 6"
              />
              {/* 3 Classic Washing Drum Lifters (Wäschemitnehmer) */}
              <path
                d="M50 4 L56 24 L44 24 Z"
                fill="rgba(56, 189, 248, 0.35)"
                stroke="rgba(125, 211, 252, 0.65)"
                strokeWidth="1.2"
              />
              <path
                d="M89.8 73 L70 67 L76 56 Z"
                fill="rgba(56, 189, 248, 0.35)"
                stroke="rgba(125, 211, 252, 0.65)"
                strokeWidth="1.2"
              />
              <path
                d="M10.2 73 L24 56 L30 67 Z"
                fill="rgba(56, 189, 248, 0.35)"
                stroke="rgba(125, 211, 252, 0.65)"
                strokeWidth="1.2"
              />
              {/* Drum Center Hub */}
              <circle
                cx="50"
                cy="50"
                r="9"
                stroke="rgba(125, 211, 252, 0.6)"
                strokeWidth="1.5"
                fill="rgba(14, 165, 233, 0.2)"
              />
              <circle cx="50" cy="30" r="1.8" fill="rgba(186, 230, 253, 0.65)" />
              <circle cx="67" cy="60" r="1.8" fill="rgba(186, 230, 253, 0.65)" />
              <circle cx="33" cy="60" r="1.8" fill="rgba(186, 230, 253, 0.65)" />
            </svg>
          </div>

          {/* Interlocking Counter-Rotating Spare-Parts Cogwheel (Ersatzteil-Zahnrad) */}
          <div className="hero-ring-ccw absolute -top-2 right-1 sm:right-2 h-16 w-16 sm:h-20 sm:w-20">
            <svg viewBox="0 0 80 80" className="h-full w-full" fill="none">
              <circle
                cx="40"
                cy="40"
                r="26"
                stroke="rgba(56, 189, 248, 0.55)"
                strokeWidth="5"
                strokeDasharray="7 5.8"
              />
              <circle
                cx="40"
                cy="40"
                r="20"
                stroke="rgba(125, 211, 252, 0.45)"
                strokeWidth="1.75"
                fill="rgba(15, 23, 42, 0.55)"
              />
              <circle
                cx="40"
                cy="40"
                r="8"
                stroke="rgba(56, 189, 248, 0.7)"
                strokeWidth="1.75"
              />
            </svg>
          </div>

          {/* Oscillating Service Wrench Badge (Vor-Ort-Diagnose & Reparatur) */}
          <div className="hero-wrench-swing absolute -left-3 bottom-6 sm:bottom-8 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-sky-400/35 bg-slate-900/75 shadow-[0_0_20px_rgba(14,165,233,0.3)] backdrop-blur-xs">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-sky-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>

          {/* Floating Cooling Crystal (Kühlschrank / Gefriergerät Service) & Heating Element (Herd / Backofen) */}
          <div className="hero-coil-pulse absolute -left-8 top-6 hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/30 bg-slate-900/60 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
            </svg>
          </div>
        </div>

        {/* Lower Edge: Mobile Vor-Ort-Service Route Across Osnabrück + Gliding Service Van */}
        <div className="absolute inset-x-0 bottom-0 h-18 sm:h-24 overflow-hidden opacity-75">
          {/* Gliding Mobile Service Van Along the Osnabrück Route */}
          <div className="hero-van-route absolute bottom-3.5 sm:bottom-5 left-0 w-full pointer-events-none">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.25)]">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 17h4V5H2v12h3" />
                <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
              <span>Vor-Ort Osnabrück</span>
            </div>
          </div>

          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="hero-wave-slide h-full w-[200%] max-w-none"
          >
            <defs>
              <linearGradient id={waveGradPrimary} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.16)" />
                <stop offset="25%" stopColor="rgba(56, 189, 248, 0.48)" />
                <stop offset="50%" stopColor="rgba(52, 211, 153, 0.35)" />
                <stop offset="75%" stopColor="rgba(56, 189, 248, 0.48)" />
                <stop offset="100%" stopColor="rgba(56, 189, 248, 0.16)" />
              </linearGradient>
              <linearGradient id={waveGradSecondary} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(14, 165, 233, 0.32)" />
                <stop offset="50%" stopColor="rgba(125, 211, 252, 0.42)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0.32)" />
              </linearGradient>
              <linearGradient id={waveFill} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.10)" />
                <stop offset="100%" stopColor="rgba(2, 6, 23, 0)" />
              </linearGradient>
            </defs>
            <path
              d="M0,74 C150,28 300,110 450,66 C525,42 562,58 600,74 C750,28 900,110 1050,66 C1125,42 1162,58 1200,74 L1200,120 L0,120 Z"
              fill={`url(#${waveFill})`}
            />
            {/* Continuous Water / Diagnostic Wave */}
            <path
              d="M0,74 C150,28 300,110 450,66 C525,42 562,58 600,74 C750,28 900,110 1050,66 C1125,42 1162,58 1200,74"
              fill="none"
              stroke={`url(#${waveGradPrimary})`}
              strokeWidth="2"
            />
            {/* Dashed On-Site Navigation Route Line (Osnabrück & Umland) */}
            <path
              d="M0,90 C180,116 320,42 480,84 C540,98 570,92 600,90 C780,116 920,42 1080,84 C1140,98 1170,92 1200,90"
              fill="none"
              stroke={`url(#${waveGradSecondary})`}
              strokeWidth="1.6"
              strokeDasharray="8 6"
            />
          </svg>
        </div>
      </div>
    </>
  );
}
