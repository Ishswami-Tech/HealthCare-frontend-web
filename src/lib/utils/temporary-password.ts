const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SPECIAL = "@#$%&*!?";
const ALL = LOWER + UPPER + DIGITS + SPECIAL;
const LENGTH = 16;

const pick = (alphabet: string, random: number): string => alphabet.charAt(random % alphabet.length);

/**
 * A random password for an account a staff member creates on a patient's behalf. Patients sign in
 * with a one-time code, so nobody needs to read it out; it must not be guessable from the phone
 * number (the old "Temp@<last4>Aa" was). Contains a lower-case letter, an upper-case letter, a
 * digit and a special character, so it passes the password rules.
 */
export function generateTemporaryPassword(): string {
  const bytes = new Uint32Array(LENGTH);
  crypto.getRandomValues(bytes);
  const chars = [
    pick(LOWER, bytes[0] as number),
    pick(UPPER, bytes[1] as number),
    pick(DIGITS, bytes[2] as number),
    pick(SPECIAL, bytes[3] as number),
  ];
  for (let index = chars.length; index < LENGTH; index += 1) {
    chars.push(pick(ALL, bytes[index] as number));
  }
  // Shuffle so the guaranteed characters are not always first.
  const order = new Uint32Array(LENGTH);
  crypto.getRandomValues(order);
  return chars
    .map((char, index) => ({ char, key: order[index] as number }))
    .sort((left, right) => left.key - right.key)
    .map(entry => entry.char)
    .join("");
}
