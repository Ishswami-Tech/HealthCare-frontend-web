import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type IconPaletteKey = keyof typeof ICON_STYLES;

export type IconPaletteValue = {
  background: string;
  icon: string;
  accent: string;
};

const ICON_STYLES = {
  activity: {
    background: "bg-gradient-to-r from-[#22c55e] via-[#16a34a] to-[#15803d]",
    icon: "text-white",
    accent: "text-[#16a34a]",
  },
  alertcircle: {
    background: "bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#facc15]",
    icon: "text-slate-900",
    accent: "text-[#f97316]",
  },
  arrowright: {
    background: "bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#7c3aed]",
    icon: "text-white",
    accent: "text-[#2563eb]",
  },
  award: {
    background: "bg-gradient-to-r from-[#facc15] via-[#eab308] to-[#d97706]",
    icon: "text-slate-900",
    accent: "text-[#d97706]",
  },
  baby: {
    background: "bg-gradient-to-r from-[#ec4899] via-[#f472b6] to-[#fbcfe8]",
    icon: "text-white",
    accent: "text-[#ec4899]",
  },
  bookopen: {
    background: "bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]",
    icon: "text-white",
    accent: "text-[#7c3aed]",
  },
  brain: {
    background: "bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-[#0369a1]",
    icon: "text-white",
    accent: "text-[#0ea5e9]",
  },
  building: {
    background: "bg-gradient-to-r from-[#94a3b8] via-[#64748b] to-[#475569]",
    icon: "text-white",
    accent: "text-[#64748b]",
  },
  calendar: {
    background: "bg-gradient-to-r from-[#14b8a6] via-[#0f766e] to-[#14532d]",
    icon: "text-white",
    accent: "text-[#0f766e]",
  },
  camera: {
    background: "bg-gradient-to-r from-[#f59e0b] via-[#facc15] to-[#fde047]",
    icon: "text-slate-900",
    accent: "text-[#f59e0b]",
  },
  checkcircle: {
    background: "bg-gradient-to-r from-[#65a30d] via-[#3f6212] to-[#1a2e05]",
    icon: "text-white",
    accent: "text-[#65a30d]",
  },
  clock: {
    background: "bg-gradient-to-r from-[#fb7185] via-[#f97316] to-[#c2410c]",
    icon: "text-white",
    accent: "text-[#fb7185]",
  },
  droplets: {
    background: "bg-gradient-to-r from-[#06b6d4] via-[#0ea5e9] to-[#3b82f6]",
    icon: "text-white",
    accent: "text-[#0ea5e9]",
  },
  flame: {
    background: "bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#facc15]",
    icon: "text-white",
    accent: "text-[#ef4444]",
  },
  globe: {
    background: "bg-gradient-to-r from-[#38bdf8] via-[#1d4ed8] to-[#312e81]",
    icon: "text-white",
    accent: "text-[#1d4ed8]",
  },
  graduationcap: {
    background: "bg-gradient-to-r from-[#0f766e] via-[#047857] to-[#022c22]",
    icon: "text-white",
    accent: "text-[#047857]",
  },
  heart: {
    background: "bg-gradient-to-r from-[#f43f5e] via-[#e11d48] to-[#9f1239]",
    icon: "text-white",
    accent: "text-[#f43f5e]",
  },
  instagram: {
    background: "bg-gradient-to-r from-[#fd1d1d] via-[#fcb045] to-[#833ab4]",
    icon: "text-white",
    accent: "text-[#fd1d1d]",
  },
  leaf: {
    background: "bg-gradient-to-r from-[#16a34a] via-[#4ade80] to-[#bbf7d0]",
    icon: "text-slate-900",
    accent: "text-[#16a34a]",
  },
  mail: {
    background: "bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]",
    icon: "text-white",
    accent: "text-[#2563eb]",
  },
  mappin: {
    background: "bg-gradient-to-r from-[#ea580c] via-[#d97706] to-[#9a3412]",
    icon: "text-white",
    accent: "text-[#d97706]",
  },
  messagecircle: {
    background: "bg-gradient-to-r from-[#0ea5e9] via-[#22d3ee] to-[#a855f7]",
    icon: "text-slate-900",
    accent: "text-[#0ea5e9]",
  },
  phone: {
    background: "bg-gradient-to-r from-[#10b981] via-[#059669] to-[#134e4a]",
    icon: "text-white",
    accent: "text-[#059669]",
  },
  play: {
    background: "bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#fb7185]",
    icon: "text-white",
    accent: "text-[#ef4444]",
  },
  send: {
    background: "bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#c4b5fd]",
    icon: "text-white",
    accent: "text-[#6366f1]",
  },
  shield: {
    background: "bg-gradient-to-r from-[#475569] via-[#1e293b] to-[#020617]",
    icon: "text-white",
    accent: "text-[#1e293b]",
  },
  star: {
    background: "bg-gradient-to-r from-[#facc15] via-[#eab308] to-[#f59e0b]",
    icon: "text-slate-900",
    accent: "text-[#eab308]",
  },
  target: {
    background: "bg-gradient-to-r from-[#4f46e5] via-[#4338ca] to-[#312e81]",
    icon: "text-white",
    accent: "text-[#4338ca]",
  },
  trendingup: {
    background: "bg-gradient-to-r from-[#6366f1] via-[#22d3ee] to-[#10b981]",
    icon: "text-white",
    accent: "text-[#22d3ee]",
  },
  user: {
    background: "bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#7c3aed]",
    icon: "text-white",
    accent: "text-[#a855f7]",
  },
  users: {
    background: "bg-gradient-to-r from-[#f472b6] via-[#ec4899] to-[#be185d]",
    icon: "text-white",
    accent: "text-[#ec4899]",
  },
  zap: {
    background: "bg-gradient-to-r from-[#fde047] via-[#facc15] to-[#f97316]",
    icon: "text-slate-900",
    accent: "text-[#facc15]",
  },
} satisfies Record<string, IconPaletteValue>;

const DEFAULT_STYLE: IconPaletteValue = {
  background: "bg-gradient-to-r from-primary to-primary/80",
  icon: "text-white",
  accent: "text-primary",
};

const normalizeKey = (value?: string | null): string | null => {
  if (!value) return null;
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

type PaletteInput = IconPaletteKey | string | LucideIcon | ComponentType | null | undefined;

const resolveKey = (input: PaletteInput): string | null => {
  if (!input) return null;

  if (typeof input === "string") {
    return normalizeKey(input);
  }

  const component = input as LucideIcon;
  const rawKey = component.displayName ?? component.name ?? null;

  return normalizeKey(rawKey);
};

export const getIconPalette = (input?: PaletteInput): IconPaletteValue => {
  const key = resolveKey(input);

  if (!key) {
    return DEFAULT_STYLE;
  }

  return ICON_STYLES[key as IconPaletteKey] ?? DEFAULT_STYLE;
};

export const iconPaletteKeys = Object.freeze(Object.keys(ICON_STYLES));
