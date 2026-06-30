function isGenericIdentityToken(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  const stripped = normalized.replace(/[^a-z0-9]+/g, " ").trim();
  if (!stripped) return true;

  const genericTokens = new Set([
    "patient",
    "user",
    "doctor",
    "member",
    "account",
    "guest",
    "unknown",
    "test",
    "anonymous",
  ]);

  return stripped
    .split(/\s+/)
    .every((token) => genericTokens.has(token));
}

function isPhoneOrEmailLike(value: string): boolean {
  return (
    /^[+\d][\d\s().-]{6,}$/.test(value) ||
    value.includes("@") ||
    /@(temp|tempemail|fake|test)\./i.test(value)
  );
}

function deriveInitials(name: string): string {
  const tokens = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0]?.[0] || ""}${tokens[1]?.[0] || ""}`.toUpperCase();
  }
  return `${tokens[0]?.[0] || name[0] || "U"}`.toUpperCase();
}

function normalizeDisplayCandidate(value: string | null | undefined): string {
  return String(value || "").trim().replace(/[._-]+/g, " ");
}

export function resolveDisplayNameAndInitials(user: {
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  name?: string | null | undefined;
  email?: string | null | undefined;
  role?: string | null | undefined;
}): { displayName: string; initials: string } {
  const firstName = normalizeDisplayCandidate(user.firstName);
  const lastName = normalizeDisplayCandidate(user.lastName);

  if (firstName || lastName) {
    const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
    if (combined && !isGenericIdentityToken(combined) && !isPhoneOrEmailLike(combined)) {
      return {
        displayName: combined,
        initials: `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase(),
      };
    }
  }

  const rawName = normalizeDisplayCandidate(user.name);
  if (rawName && !isGenericIdentityToken(rawName) && !isPhoneOrEmailLike(rawName)) {
    const safeCandidate: string = rawName.includes("@")
      ? (rawName.split("@")[0] ?? "")
      : rawName;
    return {
      displayName: safeCandidate,
      initials: deriveInitials(safeCandidate),
    };
  }

  const rawEmail = normalizeDisplayCandidate(user.email);
  if (rawEmail && !isGenericIdentityToken(rawEmail) && !/@(temp|tempemail|fake|test)\./i.test(rawEmail)) {
    const emailPrefix: string = rawEmail.split("@")[0] ?? "";
    const displayName: string = emailPrefix.replace(/[._-]+/g, " ").trim();
    if (displayName && !isGenericIdentityToken(displayName)) {
      return {
        displayName,
        initials: deriveInitials(displayName),
      };
    }
  }

  const roleLabel = String(user.role || "").toUpperCase().replace(/\s+/g, "_") === "PATIENT" ? "Patient" : "User";
  return {
    displayName: roleLabel,
    initials: roleLabel === "Patient" ? "P" : "U",
  };
}

export function resolvePatientDisplayName(user: {
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  name?: string | null | undefined;
  email?: string | null | undefined;
  role?: string | null | undefined;
}): string {
  return resolveDisplayNameAndInitials(user).displayName;
}
