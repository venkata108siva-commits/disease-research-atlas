import { Check, HeartPulse, PawPrint, Sprout, Tractor, type LucideIcon } from "lucide-react";
import type { Domain } from "@/lib/catalog";

export const DOMAIN_META: Record<Domain, { label: string; short: string; Icon: LucideIcon; bg: string }> = {
  human: { label: "Human diseases", short: "Human", Icon: HeartPulse, bg: "var(--human)" },
  animal: { label: "Animal diseases", short: "Animal", Icon: PawPrint, bg: "var(--animal)" },
  plant: { label: "Plant diseases", short: "Plant", Icon: Sprout, bg: "var(--plant)" },
  agri: { label: "Agriculture problems", short: "Agriculture", Icon: Tractor, bg: "var(--agri)" },
};

export function Verified({ title = "Verified: peer-reviewed, indexed source" }: { title?: string }) {
  return (
    <span className="check" title={title} aria-label={title}>
      <Check />
    </span>
  );
}

export function DomainIcon({ domain, size = 20, className = "ic" }: { domain: Domain; size?: number; className?: string }) {
  const m = DOMAIN_META[domain];
  return (
    <span className={className} style={{ background: m.bg }}>
      <m.Icon size={size} />
    </span>
  );
}

export function Pulse() {
  return (
    <svg className="pulse" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M2 20h8l4-10 6 20 6-16 4 6h8" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
