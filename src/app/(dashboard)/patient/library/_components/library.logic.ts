import {
  Apple,
  Baby,
  BookOpen,
  Brain,
  Droplet,
  Dumbbell,
  Flower2,
  GlassWater,
  Heart,
  Leaf,
  Moon,
  Salad,
  Stethoscope,
  Sun,
  Wind,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";
import type {
  HealthLibraryListFilters,
  HealthLibraryPost,
} from "@/lib/actions/health-library.server";

/**
 * Pure helpers for the patient Health Library screens. Nothing here fetches: the containers
 * pass API posts in and the views get plain, display-ready values out.
 */

export const LIBRARY_HREF = "/patient/library";
export const BOOK_VISIT_HREF = "/patient/appointments?openBooking=1";
export const BOOK_VIDEO_VISIT_HREF = "/patient/appointments?openBooking=1&mode=VIDEO";

export function libraryItemHref(id: string): string {
  return `${LIBRARY_HREF}/${encodeURIComponent(id)}`;
}

export function libraryTopicHref(category: string): string {
  return `${LIBRARY_HREF}/topic/${encodeURIComponent(category.trim())}`;
}

// ── Shelves (tabs) ─────────────────────────────────────────────────────────

/** `all` is the overview; the rest are the shelves of `GET health-library`. */
export type LibraryTabKey = "all" | "articles" | "videos" | "guides" | "practices" | "courses";
export type LibraryShelfKey = Exclude<LibraryTabKey, "all">;

export const LIBRARY_SHELVES: LibraryShelfKey[] = ["articles", "videos", "guides", "practices", "courses"];

export const SHELF_LABEL: Record<LibraryShelfKey, string> = {
  articles: "Articles",
  videos: "Videos",
  guides: "Guides",
  practices: "Practices",
  courses: "Courses",
};

/** The same mapping as the home page strip, so "See all" shows the same items. */
export const SHELF_FILTERS: Record<LibraryShelfKey, HealthLibraryListFilters> = {
  articles: { tab: "ARTICLES" },
  videos: { mediaType: "VIDEO" },
  guides: { tab: "GUIDES" },
  practices: { tab: "PRACTICES" },
  courses: { tab: "COURSES" },
};

export function parseLibraryTab(value: string | null | undefined): LibraryTabKey {
  const key = String(value ?? "").toLowerCase();
  return key === "articles" || key === "videos" || key === "guides" || key === "practices" || key === "courses"
    ? key
    : "all";
}

/** Cards per page on a shelf, in search results and on a topic page. */
export const LIBRARY_PAGE_SIZE = 12;
export const TOPIC_PAGE_SIZE = 30;

export function parsePage(value: string | null | undefined): number {
  const page = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(page) && page > 1 ? page : 1;
}

// ── Topic look (icon + colour from the category name) ──────────────────────

export type LibraryToneKey = "rose" | "green" | "violet" | "amber" | "indigo" | "blue" | "pink" | "orange";

export interface LibraryTone {
  /** Solid icon square (white icon). */
  solid: string;
  /** Small uppercase label on a white card. */
  text: string;
  /** Soft tinted surface with the matching icon colour (picture placeholders). */
  soft: string;
  /** The same tint without a text colour (numbered section rows). */
  wash: string;
  /** Matching `Pill` tone. */
  pill: "rose" | "green" | "video" | "amber" | "blue";
}

export const LIBRARY_TONES: Record<LibraryToneKey, LibraryTone> = {
  rose: {
    solid: "bg-[#e11d48] shadow-[0_4px_10px_rgba(225,29,72,0.3)]",
    text: "text-[#e11d48] dark:text-rose-300",
    soft: "bg-[#fff1f2] text-[#e11d48] dark:bg-rose-500/10 dark:text-rose-300",
    wash: "bg-[#fff1f2] dark:bg-rose-500/10",
    pill: "rose",
  },
  green: {
    solid: "bg-[#059669] shadow-[0_4px_10px_rgba(5,150,105,0.3)]",
    text: "text-[#047857] dark:text-emerald-300",
    soft: "bg-[#ecfdf5] text-[#059669] dark:bg-emerald-500/10 dark:text-emerald-300",
    wash: "bg-[#ecfdf5] dark:bg-emerald-500/10",
    pill: "green",
  },
  violet: {
    solid: "bg-[#7c3aed] shadow-[0_4px_10px_rgba(124,58,237,0.3)]",
    text: "text-[#7c3aed] dark:text-violet-300",
    soft: "bg-[#f5f3ff] text-[#7c3aed] dark:bg-violet-500/10 dark:text-violet-300",
    wash: "bg-[#f5f3ff] dark:bg-violet-500/10",
    pill: "video",
  },
  amber: {
    solid: "bg-[#d97706] shadow-[0_4px_10px_rgba(217,119,6,0.3)]",
    text: "text-[#b45309] dark:text-amber-300",
    soft: "bg-[#fffbeb] text-[#d97706] dark:bg-amber-500/10 dark:text-amber-300",
    wash: "bg-[#fffbeb] dark:bg-amber-500/10",
    pill: "amber",
  },
  indigo: {
    solid: "bg-[#4338ca] shadow-[0_4px_10px_rgba(67,56,202,0.3)]",
    text: "text-[#4338ca] dark:text-indigo-300",
    soft: "bg-[#eef2ff] text-[#4338ca] dark:bg-indigo-500/10 dark:text-indigo-300",
    wash: "bg-[#eef2ff] dark:bg-indigo-500/10",
    pill: "video",
  },
  blue: {
    solid: "bg-[#0284c7] shadow-[0_4px_10px_rgba(2,132,199,0.3)]",
    text: "text-[#0369a1] dark:text-sky-300",
    soft: "bg-[#f0f9ff] text-[#0284c7] dark:bg-sky-500/10 dark:text-sky-300",
    wash: "bg-[#f0f9ff] dark:bg-sky-500/10",
    pill: "blue",
  },
  pink: {
    solid: "bg-[#db2777] shadow-[0_4px_10px_rgba(219,39,119,0.3)]",
    text: "text-[#be185d] dark:text-pink-300",
    soft: "bg-[#fdf2f8] text-[#db2777] dark:bg-pink-500/10 dark:text-pink-300",
    wash: "bg-[#fdf2f8] dark:bg-pink-500/10",
    pill: "rose",
  },
  orange: {
    solid: "bg-[#ea580c] shadow-[0_4px_10px_rgba(234,88,12,0.3)]",
    text: "text-[#c2410c] dark:text-orange-300",
    soft: "bg-[#fff7ed] text-[#ea580c] dark:bg-orange-500/10 dark:text-orange-300",
    wash: "bg-[#fff7ed] dark:bg-orange-500/10",
    pill: "amber",
  },
};

export type LibraryIcon = ComponentType<LucideProps>;

/** First matching rule wins; anything else gets the book icon and a colour from its name. */
const TOPIC_RULES: Array<[RegExp, LibraryIcon, LibraryToneKey]> = [
  [/heart|cardio|blood pressure|\bbp\b|cholesterol/, Heart, "rose"],
  [/diabet|sugar/, Droplet, "amber"],
  [/sleep|insomnia/, Moon, "indigo"],
  [/yoga|breath|pranayam/, Wind, "violet"],
  [/mind|stress|mental|anxiet|mood|meditat/, Brain, "violet"],
  [/hydrat|water/, GlassWater, "blue"],
  [/digest|gut|stomach/, Salad, "amber"],
  [/nutrition|diet|food|eating/, Apple, "green"],
  [/fitness|exercise|workout|movement|activity/, Dumbbell, "blue"],
  [/women|pregnan|maternal|menstru/, Flower2, "pink"],
  [/kid|child|baby|infant|paediatric|pediatric/, Baby, "orange"],
  [/season|monsoon|summer|winter/, Sun, "orange"],
  [/ayurved|herb|natural/, Leaf, "green"],
  [/visit|clinic|appointment|test|insurance/, Stethoscope, "blue"],
];

const FALLBACK_TONES: LibraryToneKey[] = ["green", "blue", "violet", "amber", "indigo", "rose", "pink", "orange"];

export interface TopicLook {
  icon: LibraryIcon;
  toneKey: LibraryToneKey;
  tone: LibraryTone;
}

export function topicLook(category: string | null | undefined): TopicLook {
  const name = String(category ?? "").trim().toLowerCase();
  for (const [pattern, icon, toneKey] of TOPIC_RULES) {
    if (pattern.test(name)) return { icon, toneKey, tone: LIBRARY_TONES[toneKey] };
  }
  const hash = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const toneKey = FALLBACK_TONES[hash % FALLBACK_TONES.length] ?? "green";
  return { icon: BookOpen, toneKey, tone: LIBRARY_TONES[toneKey] };
}

// ── Formatting ─────────────────────────────────────────────────────────────

/** 1240 -> "1.2k", 12400 -> "12.4k", 87 -> "87". */
export function compactCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 1000) return String(Math.floor(value));
  const unit = value < 1_000_000 ? "k" : "M";
  const scaled = value / (unit === "k" ? 1000 : 1_000_000);
  const text = scaled >= 100 ? String(Math.floor(scaled)) : (Math.floor(scaled * 10) / 10).toFixed(1);
  return `${text.replace(/\.0$/, "")}${unit}`;
}

/** "12.4k views", "1 view". Empty when nobody has opened the post yet. */
export function viewsLabel(viewCount: number | null | undefined): string {
  const views = typeof viewCount === "number" && Number.isFinite(viewCount) ? Math.floor(viewCount) : 0;
  if (views <= 0) return "";
  return views === 1 ? "1 view" : `${compactCount(views)} views`;
}

/** 504 -> "8:24", 3725 -> "1:02:05". Empty when the length is unknown. */
export function videoLengthLabel(seconds: number | null | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** "18 Sept 2026". Empty for a missing or broken date. */
export function publishedLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}

/** What the author is to the patient. The API sends the user role, not a speciality. */
export function authorRoleLabel(role: string | null | undefined): string {
  return String(role ?? "").toUpperCase() === "DOCTOR" ? "Doctor at your clinic" : "Your clinic team";
}

/** "Dr. " is added for doctors whose stored name does not already carry it. */
export function authorDisplayName(name: string | null | undefined, role: string | null | undefined): string {
  const clean = String(name ?? "").trim();
  if (!clean) return "";
  if (String(role ?? "").toUpperCase() !== "DOCTOR" || /^dr\.?\s/i.test(clean)) return clean;
  return `Dr. ${clean}`;
}

export function isVideoPost(post: Pick<HealthLibraryPost, "mediaType">): boolean {
  return post.mediaType === "VIDEO";
}

const KIND_LABEL: Record<HealthLibraryPost["tab"], string> = {
  ARTICLES: "Article",
  GUIDES: "Guide",
  PRACTICES: "Practice",
  COURSES: "Course",
};

/** "Video", "Guide", "Article" … — a video is a video whatever shelf it sits on. */
export function kindLabel(post: Pick<HealthLibraryPost, "mediaType" | "tab">): string {
  return isVideoPost(post) ? "Video" : (KIND_LABEL[post.tab] ?? "Article");
}

// ── Card model ─────────────────────────────────────────────────────────────

export interface LibraryCardItem {
  id: string;
  href: string;
  title: string;
  /** Small uppercase label: "HEART HEALTH", "VIDEO · 8:24", "GUIDE · YOUR VISIT". */
  eyebrow: string;
  /** Second line: "6 min read · 12.4k views". */
  meta: string;
  /** "Article · 6 min read" — the numbered rows of a topic. */
  kindMeta: string;
  summary: string;
  category: string;
  coverImageUrl: string | null;
  isVideo: boolean;
  viewCount: number;
}

export function toCardItem(post: HealthLibraryPost): LibraryCardItem {
  const isVideo = isVideoPost(post);
  const category = String(post.category ?? "").trim();
  const length = videoLengthLabel(post.videoDurationSeconds);
  const readTime = String(post.readTime ?? "").trim();
  const author = authorDisplayName(post.authorName, post.authorRole);
  const views = viewsLabel(post.viewCount);

  const eyebrow = isVideo
    ? ["Video", length].filter(Boolean).join(" · ")
    : post.tab === "ARTICLES"
      ? category
      : [KIND_LABEL[post.tab], category].filter(Boolean).join(" · ");

  // A video card already shows its length, so the second line names who made it.
  const meta = isVideo
    ? [author || (length ? "" : readTime), views].filter(Boolean).join(" · ")
    : [readTime, views].filter(Boolean).join(" · ");

  return {
    id: post.id,
    href: libraryItemHref(post.id),
    title: post.title,
    eyebrow,
    meta,
    kindMeta: [kindLabel(post), readTime || (isVideo ? length : "")].filter(Boolean).join(" · "),
    summary: String(post.summary ?? "").trim(),
    category,
    coverImageUrl: resolveCoverUrl(post),
    isVideo,
    viewCount: typeof post.viewCount === "number" && post.viewCount > 0 ? post.viewCount : 0,
  };
}

/** The post's own cover, or the YouTube thumbnail of its video when it has no cover. */
export function resolveCoverUrl(post: Pick<HealthLibraryPost, "coverImageUrl" | "videoUrl">): string | null {
  const cover = String(post.coverImageUrl ?? "").trim();
  if (/^https?:\/\//i.test(cover) || cover.startsWith("data:image/")) return cover;
  const video = parseVideoSource(post.videoUrl);
  return video?.kind === "youtube" ? video.posterUrl : null;
}

// ── Topics ─────────────────────────────────────────────────────────────────

export interface LibraryTopic {
  /** The category exactly as the clinic wrote it (first spelling seen). */
  name: string;
  href: string;
  count: number;
}

/** Distinct categories of the given posts, the busiest first. Matching ignores case. */
export function buildTopics(posts: HealthLibraryPost[]): LibraryTopic[] {
  const byKey = new Map<string, LibraryTopic>();
  for (const post of posts) {
    const name = String(post.category ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const known = byKey.get(key);
    if (known) known.count += 1;
    else byKey.set(key, { name, href: libraryTopicHref(name), count: 1 });
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** The posts people opened most, at most `size`. Posts nobody opened are left out. */
export function mostRead(posts: HealthLibraryPost[], size: number): HealthLibraryPost[] {
  return posts
    .filter((post) => typeof post.viewCount === "number" && post.viewCount > 0)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, size);
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "24 articles · 9 videos · 3 guides" for a list that is fully loaded. */
export function topicBreakdown(posts: HealthLibraryPost[]): string {
  const counts = { articles: 0, videos: 0, guides: 0, practices: 0, courses: 0 };
  for (const post of posts) {
    if (isVideoPost(post)) counts.videos += 1;
    else if (post.tab === "GUIDES") counts.guides += 1;
    else if (post.tab === "PRACTICES") counts.practices += 1;
    else if (post.tab === "COURSES") counts.courses += 1;
    else counts.articles += 1;
  }
  return [
    counts.articles ? plural(counts.articles, "article", "articles") : "",
    counts.videos ? plural(counts.videos, "video", "videos") : "",
    counts.guides ? plural(counts.guides, "guide", "guides") : "",
    counts.practices ? plural(counts.practices, "practice", "practices") : "",
    counts.courses ? plural(counts.courses, "course", "courses") : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** `[topic]` from the URL back to the category name. A stray "%" must not break the page. */
export function decodeTopicParam(value: string | null | undefined): string {
  const raw = String(value ?? "");
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export function itemsLabel(total: number): string {
  return plural(total, "item", "items");
}

// ── Article body ───────────────────────────────────────────────────────────

/**
 * The API sends plain text (`summary`, `sections[].heading`, `sections[].body`,
 * `whenToSeeDoctor`) — no HTML and no markdown. Text is split into paragraphs on blank lines
 * and rendered as React text nodes, so nothing a clinic types is ever treated as markup.
 */
export function toParagraphs(text: string | null | undefined): string[] {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export function toSections(post: Pick<HealthLibraryPost, "sections">): ArticleSection[] {
  const sections = Array.isArray(post.sections) ? post.sections : [];
  return sections
    .map((section) => ({
      heading: String(section?.heading ?? "").trim(),
      paragraphs: toParagraphs(section?.body),
    }))
    .filter((section) => section.heading || section.paragraphs.length > 0);
}

// ── Video ──────────────────────────────────────────────────────────────────

/**
 * `videoUrl` is "YouTube / Vimeo / direct video URL" (backend DTO). Those three are played in
 * the page; any other link is only offered as a link that opens in a new tab.
 */
export type LibraryVideoSource =
  | { kind: "youtube"; url: string; embedUrl: string; posterUrl: string }
  | { kind: "vimeo"; url: string; embedUrl: string }
  | { kind: "file"; url: string }
  | { kind: "link"; url: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_FILE = /\.(mp4|m4v|webm|ogv|ogg|mov)$/i;

function youTubeId(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m)\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  if (host === "youtu.be") {
    id = parts[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (parts[0] === "watch") id = url.searchParams.get("v") ?? undefined;
    else if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") id = parts[1];
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

export function parseVideoSource(raw: string | null | undefined): LibraryVideoSource | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const id = youTubeId(url);
  if (id) {
    return {
      kind: "youtube",
      url: url.href,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`,
      posterUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeoId = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    if (vimeoId) {
      return { kind: "vimeo", url: url.href, embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1` };
    }
  }

  if (VIDEO_FILE.test(url.pathname)) return { kind: "file", url: url.href };
  return { kind: "link", url: url.href };
}

// ── Article model ──────────────────────────────────────────────────────────

export interface LibraryArticle {
  id: string;
  title: string;
  category: string;
  topicHref: string;
  /** "6 min read", or "Video · 8:24" for a video. */
  lengthLabel: string;
  isVideo: boolean;
  coverImageUrl: string | null;
  video: LibraryVideoSource | null;
  authorName: string;
  authorRole: string;
  isDoctorAuthor: boolean;
  views: string;
  published: string;
  summary: string[];
  sections: ArticleSection[];
  whenToSeeDoctor: string[];
}

export function toArticle(post: HealthLibraryPost): LibraryArticle {
  const isVideo = isVideoPost(post);
  const category = String(post.category ?? "").trim();
  const length = videoLengthLabel(post.videoDurationSeconds);
  const readTime = String(post.readTime ?? "").trim();
  return {
    id: post.id,
    title: post.title,
    category,
    topicHref: category ? libraryTopicHref(category) : LIBRARY_HREF,
    lengthLabel: isVideo ? ["Video", length || readTime].filter(Boolean).join(" · ") : readTime,
    isVideo,
    coverImageUrl: resolveCoverUrl(post),
    video: isVideo ? parseVideoSource(post.videoUrl) : null,
    authorName: authorDisplayName(post.authorName, post.authorRole),
    authorRole: authorRoleLabel(post.authorRole),
    isDoctorAuthor: String(post.authorRole ?? "").toUpperCase() === "DOCTOR",
    views: viewsLabel(post.viewCount),
    published: publishedLabel(post.publishedAt),
    summary: toParagraphs(post.summary),
    sections: toSections(post),
    whenToSeeDoctor: toParagraphs(post.whenToSeeDoctor),
  };
}
