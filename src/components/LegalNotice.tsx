import { AlertTriangle } from "lucide-react";

export default function LegalNotice({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="my-6 flex gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-[15px] text-primary dark:text-slate-100">
      <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-deep dark:text-amber-light" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
