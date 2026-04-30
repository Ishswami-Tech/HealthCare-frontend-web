const HEX = '0123456789abcdef';

function bytesToUuid(bytes: Uint8Array): string {
  const segments = [
    bytes.slice(0, 4),
    bytes.slice(4, 6),
    bytes.slice(6, 8),
    bytes.slice(8, 10),
    bytes.slice(10, 16),
  ];

  return segments
    .map(segment =>
      Array.from(segment)
        .map(byte => HEX[(byte >> 4) & 0x0f] + HEX[byte & 0x0f])
        .join('')
    )
    .join('-');
}

function uuidToBytes(uuid: string): Uint8Array | null {
  const normalized = uuid.trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    return null;
  }

  const hex = normalized.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function v4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

function validate(uuid: string): boolean {
  return uuidToBytes(uuid) !== null;
}

function version(uuid: string): number {
  const normalized = uuid.trim().toLowerCase();
  const match = normalized.match(/^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  return match ? Number.parseInt(match[1], 10) : NaN;
}

function parse(uuid: string): Uint8Array {
  const bytes = uuidToBytes(uuid);
  if (!bytes) {
    throw new TypeError('Invalid UUID');
  }
  return bytes;
}

function stringify(bytes: ArrayLike<number>, offset = 0): string {
  const view = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes as ArrayLike<number>);
  if (offset < 0 || offset + 16 > view.length) {
    throw new TypeError('Invalid byte array');
  }
  return bytesToUuid(view.slice(offset, offset + 16));
}

const NIL = '00000000-0000-0000-0000-000000000000';
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export { MAX, NIL, parse, stringify, validate, version, v4 };

export default {
  MAX,
  NIL,
  parse,
  stringify,
  validate,
  version,
  v4,
};
