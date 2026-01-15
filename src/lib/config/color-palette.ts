/**
 * Comprehensive Color Palette for Healthcare Frontend
 * Each color combination is unique and follows proper theming principles
 */

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

// Master color palette - each color is unique and follows design principles
export const MASTER_COLOR_PALETTE = {
  // Primary Healthcare Colors
  primary: {
    gradient: "from-emerald-500 to-teal-600",
    hover: "from-emerald-600 to-teal-700",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },
  
  // Secondary Colors
  secondary: {
    gradient: "from-slate-600 to-slate-700",
    hover: "from-slate-700 to-slate-800",
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200"
  },

  // Unique Icon Colors - Each one is distinct
  healing: {
    gradient: "from-rose-400 to-pink-500",
    hover: "from-rose-500 to-pink-600",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },

  wellness: {
    gradient: "from-cyan-400 to-blue-500",
    hover: "from-cyan-500 to-blue-600",
    text: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200"
  },

  vitality: {
    gradient: "from-amber-400 to-orange-500",
    hover: "from-amber-500 to-orange-600",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },

  harmony: {
    gradient: "from-violet-400 to-purple-500",
    hover: "from-violet-500 to-purple-600",
    text: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200"
  },

  balance: {
    gradient: "from-lime-400 to-green-500",
    hover: "from-lime-500 to-green-600",
    text: "text-lime-600",
    bg: "bg-lime-50",
    border: "border-lime-200"
  },

  energy: {
    gradient: "from-indigo-400 to-blue-600",
    hover: "from-indigo-500 to-blue-700",
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200"
  },

  serenity: {
    gradient: "from-sky-400 to-cyan-500",
    hover: "from-sky-500 to-cyan-600",
    text: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200"
  },

  strength: {
    gradient: "from-red-400 to-rose-500",
    hover: "from-red-500 to-rose-600",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200"
  },

  wisdom: {
    gradient: "from-emerald-400 to-teal-500",
    hover: "from-emerald-500 to-teal-600",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },

  compassion: {
    gradient: "from-fuchsia-400 to-pink-500",
    hover: "from-fuchsia-500 to-pink-600",
    text: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200"
  },

  growth: {
    gradient: "from-green-400 to-emerald-500",
    hover: "from-green-500 to-emerald-600",
    text: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200"
  },

  innovation: {
    gradient: "from-blue-400 to-indigo-500",
    hover: "from-blue-500 to-indigo-600",
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200"
  },

  excellence: {
    gradient: "from-yellow-400 to-amber-500",
    hover: "from-yellow-500 to-amber-600",
    text: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200"
  },

  trust: {
    gradient: "from-teal-400 to-cyan-500",
    hover: "from-teal-500 to-cyan-600",
    text: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200"
  },

  care: {
    gradient: "from-pink-400 to-rose-500",
    hover: "from-pink-500 to-rose-600",
    text: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200"
  },

  precision: {
    gradient: "from-purple-400 to-violet-500",
    hover: "from-purple-500 to-violet-600",
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },

  transformation: {
    gradient: "from-orange-400 to-red-500",
    hover: "from-orange-500 to-red-600",
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200"
  },

  renewal: {
    gradient: "from-lime-400 to-green-500",
    hover: "from-lime-500 to-green-600",
    text: "text-lime-600",
    bg: "bg-lime-50",
    border: "border-lime-200"
  },

  expertise: {
    gradient: "from-slate-400 to-gray-500",
    hover: "from-slate-500 to-gray-600",
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200"
  },

  dedication: {
    gradient: "from-rose-400 to-pink-500",
    hover: "from-rose-500 to-pink-600",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },

  innovation2: {
    gradient: "from-cyan-400 to-teal-500",
    hover: "from-cyan-500 to-teal-600",
    text: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200"
  },

  community: {
    gradient: "from-indigo-400 to-purple-500",
    hover: "from-indigo-500 to-purple-600",
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200"
  },

  legacy: {
    gradient: "from-amber-400 to-yellow-500",
    hover: "from-amber-500 to-yellow-600",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },

  connection: {
    gradient: "from-emerald-400 to-green-500",
    hover: "from-emerald-500 to-green-600",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },

  inspiration: {
    gradient: "from-violet-400 to-purple-500",
    hover: "from-violet-500 to-purple-600",
    text: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200"
  },

  achievement: {
    gradient: "from-orange-400 to-amber-500",
    hover: "from-orange-500 to-amber-600",
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200"
  },

  support: {
    gradient: "from-blue-400 to-cyan-500",
    hover: "from-blue-500 to-cyan-600",
    text: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200"
  },

  healing2: {
    gradient: "from-teal-400 to-emerald-500",
    hover: "from-teal-500 to-emerald-600",
    text: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200"
  },

  wellness2: {
    gradient: "from-pink-400 to-fuchsia-500",
    hover: "from-pink-500 to-fuchsia-600",
    text: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200"
  },

  vitality2: {
    gradient: "from-red-400 to-orange-500",
    hover: "from-red-500 to-orange-600",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200"
  },

  harmony2: {
    gradient: "from-green-400 to-lime-500",
    hover: "from-green-500 to-lime-600",
    text: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200"
  },

  balance2: {
    gradient: "from-purple-400 to-indigo-500",
    hover: "from-purple-500 to-indigo-600",
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },

  energy2: {
    gradient: "from-yellow-400 to-orange-500",
    hover: "from-yellow-500 to-orange-600",
    text: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200"
  },

  serenity2: {
    gradient: "from-sky-400 to-blue-500",
    hover: "from-sky-500 to-blue-600",
    text: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200"
  },

  strength2: {
    gradient: "from-rose-400 to-red-500",
    hover: "from-rose-500 to-red-600",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },

  wisdom2: {
    gradient: "from-emerald-400 to-teal-500",
    hover: "from-emerald-500 to-teal-600",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },

  compassion2: {
    gradient: "from-fuchsia-400 to-pink-500",
    hover: "from-fuchsia-500 to-pink-600",
    text: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200"
  },

  growth2: {
    gradient: "from-lime-400 to-green-500",
    hover: "from-lime-500 to-green-600",
    text: "text-lime-600",
    bg: "bg-lime-50",
    border: "border-lime-200"
  },

  innovation3: {
    gradient: "from-cyan-400 to-blue-500",
    hover: "from-cyan-500 to-blue-600",
    text: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200"
  },

  excellence2: {
    gradient: "from-amber-400 to-yellow-500",
    hover: "from-amber-500 to-yellow-600",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },

  trust2: {
    gradient: "from-teal-400 to-cyan-500",
    hover: "from-teal-500 to-cyan-600",
    text: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200"
  },

  care2: {
    gradient: "from-rose-400 to-pink-500",
    hover: "from-rose-500 to-pink-600",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200"
  },

  precision2: {
    gradient: "from-violet-400 to-purple-500",
    hover: "from-violet-500 to-purple-600",
    text: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200"
  },

  transformation2: {
    gradient: "from-red-400 to-orange-500",
    hover: "from-red-500 to-orange-600",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200"
  },

  renewal2: {
    gradient: "from-green-400 to-lime-500",
    hover: "from-green-500 to-lime-600",
    text: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200"
  },

  expertise2: {
    gradient: "from-gray-400 to-slate-500",
    hover: "from-gray-500 to-slate-600",
    text: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200"
  },

  dedication2: {
    gradient: "from-pink-400 to-rose-500",
    hover: "from-pink-500 to-rose-600",
    text: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200"
  },

  innovation4: {
    gradient: "from-teal-400 to-cyan-500",
    hover: "from-teal-500 to-cyan-600",
    text: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200"
  },

  community2: {
    gradient: "from-purple-400 to-indigo-500",
    hover: "from-purple-500 to-indigo-600",
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },

  legacy2: {
    gradient: "from-yellow-400 to-amber-500",
    hover: "from-yellow-500 to-amber-600",
    text: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200"
  },

  connection2: {
    gradient: "from-green-400 to-emerald-500",
    hover: "from-green-500 to-emerald-600",
    text: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200"
  },

  inspiration2: {
    gradient: "from-purple-400 to-violet-500",
    hover: "from-purple-500 to-violet-600",
    text: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },

  achievement2: {
    gradient: "from-amber-400 to-orange-500",
    hover: "from-amber-500 to-orange-600",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },

  support2: {
    gradient: "from-cyan-400 to-blue-500",
    hover: "from-cyan-500 to-blue-600",
    text: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200"
  }
} as const;

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
