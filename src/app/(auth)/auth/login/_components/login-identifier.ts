import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

/**
 * Client-side check of the sign-in identifier before an OTP is requested, so a typo never sends a
 * code that cannot arrive. Messages name the field of the active tab. The server still validates.
 */

const INDIA_PREFIX = "+91";

const emailSchema = z.string().trim().email("Enter a valid email address, like name@example.com");

export function validateLoginIdentifier(method: "phone" | "email", identifier: string): string | null {
  const value = (identifier ?? "").trim();
  if (method === "email") {
    if (!value) return "Enter your email address";
    const parsed = emailSchema.safeParse(value);
    return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Enter a valid email address");
  }

  if (!value) return "Enter your mobile number";
  if (value.startsWith(INDIA_PREFIX)) {
    const national = value.slice(INDIA_PREFIX.length).replace(/\D/g, "");
    // Indian mobile numbers are 10 digits and start with 6, 7, 8 or 9.
    if (!/^[6-9]\d{9}$/.test(national)) return "Enter your 10-digit mobile number";
    return null;
  }
  return isValidPhoneNumber(value) ? null : "Enter a valid mobile number for the selected country";
}
