// Original line illustrations used until real photography is supplied.
type P = { className?: string };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function WashingMachine({ className }: P) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Waschmaschine" {...stroke}>
      <rect x="40" y="20" width="120" height="160" rx="8" />
      <line x1="40" y1="55" x2="160" y2="55" />
      <circle cx="62" cy="38" r="5" /><line x1="80" y1="38" x2="104" y2="38" /><circle cx="140" cy="38" r="5" />
      <circle cx="100" cy="115" r="38" /><circle cx="100" cy="115" r="26" />
      <path d="M82 118c6-8 12 8 18 0s12 8 18 0" />
    </svg>
  );
}
export function Dishwasher({ className }: P) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Geschirrspüler" {...stroke}>
      <rect x="35" y="20" width="130" height="160" rx="8" />
      <line x1="35" y1="52" x2="165" y2="52" />
      <circle cx="60" cy="36" r="4" /><circle cx="76" cy="36" r="4" /><line x1="120" y1="36" x2="148" y2="36" />
      <rect x="55" y="70" width="90" height="90" rx="4" />
      <line x1="55" y1="115" x2="145" y2="115" />
      <path d="M75 115v-22M90 115v-22M105 115v-22M120 115v-22" />
      <circle cx="100" cy="140" r="9" />
    </svg>
  );
}
export function Fridge({ className }: P) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Kühlschrank" {...stroke}>
      <rect x="50" y="14" width="100" height="172" rx="8" />
      <line x1="50" y1="76" x2="150" y2="76" />
      <line x1="66" y1="36" x2="66" y2="58" /><line x1="66" y1="96" x2="66" y2="140" />
      <path d="M100 110l0 22M90 114l20 14M110 114l-20 14" />
    </svg>
  );
}
export function Oven({ className }: P) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Backofen" {...stroke}>
      <rect x="30" y="30" width="140" height="140" rx="8" />
      <line x1="30" y1="62" x2="170" y2="62" />
      <circle cx="56" cy="46" r="5" /><circle cx="78" cy="46" r="5" /><circle cx="122" cy="46" r="5" /><circle cx="144" cy="46" r="5" />
      <rect x="48" y="78" width="104" height="72" rx="4" />
      <line x1="62" y1="68" x2="138" y2="68" strokeWidth={3} />
      <path d="M70 128h60M70 112h60" opacity=".5" />
    </svg>
  );
}

export const serviceIcons = {
  waschmaschinen: WashingMachine,
  geschirrspueler: Dishwasher,
  kuehlschraenke: Fridge,
  backoefen: Oven,
} as const;

// Hero fallback: a workbench scene, drawn to the same proportions the final PNG should use (4:5).
export function WorkshopScene({ className }: P) {
  return (
    <svg viewBox="0 0 480 600" className={className} role="img" aria-label="Illustration von Hannachi Elektrohaushaltsgeräte & Ersatzteile" preserveAspectRatio="xMidYMid slice">
      <rect width="480" height="600" fill="#142B49" />
      <rect y="410" width="480" height="190" fill="#0B192B" />
      {/* pegboard */}
      <g stroke="#2B4468" strokeWidth="2">
        {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={30 + i * 52} y1="40" x2={30 + i * 52} y2="250" />)}
      </g>
      <g fill="none" stroke="#E9A23B" strokeWidth="3" strokeLinecap="round">
        <path d="M82 70v90M70 70h24" />
        <path d="M150 70l0 80M138 150h24" />
        <path d="M228 66c16 0 22 14 8 26l-22 36" />
        <circle cx="318" cy="100" r="22" />
        <path d="M376 66v96M364 66h24" />
      </g>
      {/* washing machine on bench */}
      <g fill="none" stroke="#F7F8FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="120" y="260" width="240" height="150" rx="8" />
        <line x1="120" y1="292" x2="360" y2="292" />
        <circle cx="240" cy="352" r="42" /><circle cx="240" cy="352" r="28" opacity=".6" />
        <circle cx="146" cy="276" r="5" /><circle cx="166" cy="276" r="5" />
      </g>
      <rect x="60" y="410" width="360" height="14" fill="#E9A23B" />
      <rect x="84" y="424" width="12" height="130" fill="#2B4468" /><rect x="384" y="424" width="12" height="130" fill="#2B4468" />
      {/* tool box */}
      <g fill="none" stroke="#F7F8FA" strokeWidth="3"><rect x="30" y="470" width="90" height="56" rx="4" /><path d="M30 490h90M62 470v-10h26v10" /></g>
    </svg>
  );
}
