const AVATAR_STYLES = [
  "bg-rose-500/20 text-rose-700 dark:text-rose-200",
  "bg-orange-500/20 text-orange-700 dark:text-orange-200",
  "bg-amber-500/20 text-amber-700 dark:text-amber-200",
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200",
  "bg-cyan-500/20 text-cyan-700 dark:text-cyan-200",
  "bg-blue-500/20 text-blue-700 dark:text-blue-200",
  "bg-indigo-500/20 text-indigo-700 dark:text-indigo-200",
  "bg-violet-500/20 text-violet-700 dark:text-violet-200",
] as const;

const AVATAR_GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-orange-500 to-amber-600",
  "from-amber-500 to-yellow-600",
  "from-emerald-500 to-teal-600",
  "from-cyan-500 to-sky-600",
  "from-blue-500 to-indigo-600",
  "from-indigo-500 to-violet-600",
  "from-fuchsia-500 to-purple-600",
] as const;

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarTone(seed: string | null | undefined) {
  const value = (seed || "guest").trim() || "guest";
  const index = hashSeed(value) % AVATAR_STYLES.length;

  return {
    backgroundClass: AVATAR_STYLES[index],
    gradientClass: AVATAR_GRADIENTS[index],
  };
}

