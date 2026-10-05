/**
 * Comprehensive Color Palette for Healthcare Frontend
 * Each color combination is unique and follows proper theming principles
 */

import { ACCENTS, type AccentName } from "@/lib/design/tokens";

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface IconColorScheme {
  gradient: string;
  hover: string;
  text: string;
  bg: string;
  border: string;
}

export interface AvatarTone {
  backgroundClass: string;
  textClass: string;
  gradientClass?: string;
}

export interface VideoTileTone {
  backgroundClass: string;
  textClass: string;
}

const AVATAR_TONE_PALETTE: readonly AvatarTone[] = [
  { backgroundClass: "bg-[#E3F2FD]", textClass: "text-[#1565C0]" }, // Light Blue
  { backgroundClass: "bg-[#FCE4EC]", textClass: "text-[#C2185B]" }, // Light Pink
  { backgroundClass: "bg-[#E8F5E9]", textClass: "text-[#2E7D32]" }, // Light Green
  { backgroundClass: "bg-[#FFFDE7]", textClass: "text-[#FBC02D]" }, // Light Yellow
  { backgroundClass: "bg-[#F3E5F5]", textClass: "text-[#7B1FA2]" }, // Light Purple
  { backgroundClass: "bg-[#E0F7FA]", textClass: "text-[#00838F]" }, // Light Cyan
  { backgroundClass: "bg-[#FFF3E0]", textClass: "text-[#E65100]" }, // Light Orange
  { backgroundClass: "bg-[#F1F3F4]", textClass: "text-[#5F6368]" }, // Google Meet Style Grey
] as const;

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarTone(seed: string | null | undefined): AvatarTone {
  const value = (seed || "guest").trim() || "guest";
  const index = hashSeed(value) % AVATAR_TONE_PALETTE.length;
  const tone = AVATAR_TONE_PALETTE[index] ?? AVATAR_TONE_PALETTE[0]!;

  return {
    ...tone,
    gradientClass: tone.backgroundClass,
  };
}

export const VIDEO_TILE_PALETTE: readonly VideoTileTone[] = AVATAR_TONE_PALETTE;

export function getRandomVideoTileTone(): VideoTileTone {
  const index = Math.floor(Math.random() * VIDEO_TILE_PALETTE.length);
  return VIDEO_TILE_PALETTE[index] ?? VIDEO_TILE_PALETTE[0]!;
}

/**
 * Semantic colour vocabulary, mapped onto the six project accents.
 *
 * The keys are the words the marketing pages already speak ("healing",
 * "trust", "precision"). The values constrain every one of them to the
 * standard palette in `@/lib/design/tokens`, so the public site reads as one
 * system instead of twenty-eight unrelated hues.
 *
 * To change how something looks, change its accent assignment here — not the
 * class strings at the call site.
 */
const SEMANTIC_ACCENT = {
  // Brand / restorative
  primary: "emerald",
  healing: "emerald",
  growth: "emerald",
  renewal: "emerald",
  balance: "emerald",
  care: "emerald",

  // Calm / holistic
  secondary: "teal",
  wellness: "teal",
  harmony: "teal",
  transformation: "teal",
  connection: "teal",

  // Clinical / credible
  trust: "sky",
  serenity: "sky",
  expertise: "sky",
  community: "sky",
  support: "sky",

  // Specialist / advanced
  wisdom: "violet",
  innovation: "violet",
  precision: "violet",
  legacy: "violet",
  inspiration: "violet",

  // Energy / achievement
  vitality: "amber",
  energy: "amber",
  excellence: "amber",
  dedication: "amber",
  achievement: "amber",

  // Urgency / empathy
  strength: "rose",
  compassion: "rose",
} as const satisfies Record<string, AccentName>;

function toIconColorScheme(accent: AccentName): IconColorScheme {
  const tokens = ACCENTS[accent];
  return {
    gradient: tokens.gradient,
    hover: tokens.gradientHover,
    text: tokens.text,
    bg: tokens.soft,
    border: tokens.border,
  };
}

export const MASTER_COLOR_PALETTE = Object.fromEntries(
  Object.entries(SEMANTIC_ACCENT).map(([key, accent]) => [key, toIconColorScheme(accent)])
) as Record<keyof typeof SEMANTIC_ACCENT, IconColorScheme>;

// Icon-specific color assignments
export const ICON_COLOR_MAP = {
  // Core Healthcare Icons
  Heart: "healing",
  Droplets: "wellness", 
  Flame: "vitality",
  Zap: "energy",
  Target: "precision",
  Shield: "trust",
  Star: "excellence",
  CheckCircle: "balance",
  Award: "achievement",
  Users: "community",
  Clock: "dedication",
  Calendar: "connection",
  Phone: "support",
  Mail: "communication",
  MapPin: "location",
  MessageCircle: "interaction",
  User: "individual",
  GraduationCap: "education",
  Building: "institution",
  Baby: "newLife",
  Leaf: "nature",
  Brain: "intelligence",
  Activity: "movement",
  TrendingUp: "growth",
  Globe: "worldwide",
  BookOpen: "knowledge",
  Camera: "capture",
  Instagram: "social",
  Send: "transmission",
  ArrowRight: "direction",
  Play: "action",
  Pause: "rest",
  Volume2: "sound",
  Settings: "configuration",
  Search: "discovery",
  Filter: "refinement",
  Download: "acquisition",
  Upload: "sharing",
  Share: "distribution",
  Copy: "duplication",
  Edit: "modification",
  Trash: "removal",
  Save: "preservation",
  Lock: "security",
  Unlock: "access",
  Eye: "visibility",
  EyeOff: "privacy",
  Bell: "notification",
  BellOff: "silence",
  Home: "base",
  Menu: "navigation",
  X: "close",
  Plus: "addition",
  Minus: "subtraction",
  ChevronDown: "expand",
  ChevronUp: "collapse",
  ChevronLeft: "previous",
  ChevronRight: "next",
  ExternalLink: "external",
  Link: "connection",
  Image: "visual",
  File: "document",
  Folder: "organization",
  Database: "storage",
  Server: "infrastructure",
  Cloud: "remote",
  Wifi: "connectivity",
  Battery: "power",
  Sun: "brightness",
  Moon: "darkness",
  Thermometer: "temperature",
  Gauge: "measurement",
  BarChart: "analytics",
  PieChart: "statistics",
  TrendingDown: "decline",
  Pulse: "rhythm",
  Cross: "medical",
  Stethoscope: "diagnosis",
  Pill: "medication",
  Syringe: "injection",
  Bandage: "treatment",
  Microscope: "examination",
  TestTube: "research",
  Dna: "genetics",
  Atom: "science",
  Beaker: "experiment",
  Flask: "chemistry",
  Calculator: "computation",
  Ruler: "measurement",
  Compass: "direction",
  Map: "navigation",
  Navigation: "guidance",
  Route: "path",
  Flag: "milestone",
  Trophy: "victory",
  Medal: "recognition",
  Crown: "leadership",
  Gem: "precious",
  Diamond: "valuable",
  Sparkles: "magic",
  Rainbow: "diversity",
  Palette: "creativity",
  Brush: "art",
  Pen: "writing",
  Pencil: "sketching",
  Eraser: "correction",
  Highlighter: "emphasis",
  Bookmark: "favorite",
  Tag: "label",
  Hash: "category",
  AtSign: "mention",
  Percent: "percentage",
  DollarSign: "money",
  Euro: "currency",
  Pound: "weight",
  Scissors: "cutting",
  Paperclip: "attachment",
  Pin: "location"
} as const;

// Function to get color scheme for an icon
export function getIconColorScheme(iconName: keyof typeof ICON_COLOR_MAP): IconColorScheme {
  const colorKey = ICON_COLOR_MAP[iconName] as keyof typeof MASTER_COLOR_PALETTE;
  return MASTER_COLOR_PALETTE[colorKey] || MASTER_COLOR_PALETTE.primary;
}

// Function to get random unique color for dynamic icons
export function getUniqueColor(index: number): IconColorScheme {
  const colorKeys = Object.keys(MASTER_COLOR_PALETTE) as Array<keyof typeof MASTER_COLOR_PALETTE>;
  if (colorKeys.length === 0) {
    return MASTER_COLOR_PALETTE.primary;
  }
  const colorKey = colorKeys[index % colorKeys.length];
  if (!colorKey || !(colorKey in MASTER_COLOR_PALETTE)) {
    return MASTER_COLOR_PALETTE.primary;
  }
  return MASTER_COLOR_PALETTE[colorKey];
}

// Semantic color assignments for different contexts
export const SEMANTIC_COLORS = {
  success: "balance",
  warning: "vitality", 
  error: "strength",
  info: "wellness",
  primary: "healing",
  secondary: "harmony",
  accent: "energy",
  neutral: "expertise"
} as const;

export default MASTER_COLOR_PALETTE;
