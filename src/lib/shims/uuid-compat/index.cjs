const { randomUUID } = require("crypto");

const NIL = "00000000-0000-0000-0000-000000000000";
const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function v4() {
  return randomUUID();
}

function validate(value) {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function version(value) {
  if (!validate(value)) {
    throw new TypeError("Invalid UUID");
  }

  return Number.parseInt(value[14], 16);
}

function parse(value) {
  if (!validate(value)) {
    throw new TypeError("Invalid UUID");
  }

  const hex = value.replace(/-/g, "").toLowerCase();
  const bytes = new Uint8Array(16);

  for (let i = 0; i < 16; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

function stringify(bytes, offset = 0) {
  const source = Array.from(bytes).slice(offset, offset + 16);

  if (source.length !== 16) {
    throw new TypeError("Invalid byte array length");
  }

  const hex = source.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

module.exports = {
  NIL,
  MAX,
  v1: v4,
  v3: v4,
  v4,
  v5: v4,
  v6: v4,
  v7: v4,
  parse,
  stringify,
  validate,
  version,
};
