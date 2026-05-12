export function buildGatewayOrderId(baseOrderId: string, uniqueKey: string): string {
  const normalizedBase = String(baseOrderId || '').replace(/[^A-Za-z0-9_-]/g, '-');
  const normalizedUnique = String(uniqueKey || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 8);

  if (!normalizedBase) {
    return normalizedUnique || `order-${Date.now()}`;
  }

  return normalizedUnique ? `${normalizedBase}${normalizedUnique}` : normalizedBase;
}
